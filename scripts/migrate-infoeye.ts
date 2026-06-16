/* eslint-disable no-console */
import 'reflect-metadata';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DataSource } from 'typeorm';
import { createInfofiDataSource } from '../src/infofi/infofi.datasource';

// Best-effort .env loading so the script can be run with a local .env file.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch {
  /* dotenv is optional - env vars can be provided by the shell instead */
}

/**
 * One-off ETL: copies the InfoFi data (users + leaderboards + their parents)
 * from infoeye's Supabase Postgres into this project's Postgres.
 *
 * Source is read through the Supabase REST client using the SERVICE ROLE key
 * (bypasses RLS). Target tables are created by TypeORM `synchronize` via the
 * shared entities, then rows are bulk-upserted in foreign-key order.
 *
 * Required env vars:
 *   SUPABASE_URL                 - infoeye Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY    - service role key (read, bypasses RLS)
 *   DATABASE_URL                 - target Postgres (defaults to local x_api)
 *
 * Run: npm run migrate:infoeye
 */

const PAGE_SIZE = 1000;

/** Tables to copy, in foreign-key dependency order, with their primary keys. */
const TABLES: Array<{ name: string; pk: string[] }> = [
  // Parents
  { name: 'platforms', pk: ['id'] },
  { name: 'projects', pk: ['id'] },
  { name: 'infofi_users', pk: ['twitter_id'] },
  { name: 'cookie_periods', pk: ['id'] },
  { name: 'kaito_periods', pk: ['id'] },
  { name: 'cookie_languages', pk: ['id'] },
  { name: 'wallchain_epochs', pk: ['id'] },
  // Per-platform user metrics
  { name: 'kaito_users', pk: ['twitter_id'] },
  { name: 'wallchain_users', pk: ['twitter_id'] },
  { name: 'cookie_users', pk: ['twitter_id'] },
  { name: 'platform_user_metrics', pk: ['id'] },
  // Leaderboards
  { name: 'wallchain_leaderboard', pk: ['id'] },
  { name: 'cookie_leaderboard', pk: ['id'] },
  { name: 'cookie_leaderboard_capital', pk: ['id'] },
  { name: 'kaito_leaderboard', pk: ['id'] },
  { name: 'kaito_leaderboard_history', pk: ['id'] },
];

function quoteIdent(id: string): string {
  return `"${id.replace(/"/g, '""')}"`;
}

/** jsonb / array values must be serialized before binding as pg parameters. */
function bindValue(value: unknown): unknown {
  if (value !== null && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

/** Returns the set of column names that actually exist on the target table. */
async function getTargetColumns(
  ds: DataSource,
  table: string,
): Promise<Set<string>> {
  const rows: Array<{ column_name: string }> = await ds.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  return new Set(rows.map((r) => r.column_name));
}

/**
 * Bulk-upsert a batch of rows into `table`, conflicting on its primary key.
 * Only columns present in `targetColumns` are copied - source-only columns
 * (schema drift in infoeye that we don't model here) are dropped.
 */
async function upsertBatch(
  ds: DataSource,
  table: string,
  pk: string[],
  rows: Record<string, unknown>[],
  targetColumns: Set<string>,
): Promise<void> {
  if (rows.length === 0) return;

  const columns = Object.keys(rows[0]).filter((c) => targetColumns.has(c));
  if (columns.length === 0) return;
  const params: unknown[] = [];
  const valueGroups = rows.map((row) => {
    const placeholders = columns.map((col) => {
      params.push(bindValue(row[col] ?? null));
      return `$${params.length}`;
    });
    return `(${placeholders.join(', ')})`;
  });

  const updateCols = columns.filter((c) => !pk.includes(c));
  const conflictAction = updateCols.length
    ? `DO UPDATE SET ${updateCols
        .map((c) => `${quoteIdent(c)} = EXCLUDED.${quoteIdent(c)}`)
        .join(', ')}`
    : 'DO NOTHING';

  const sql =
    `INSERT INTO ${quoteIdent(table)} ` +
    `(${columns.map(quoteIdent).join(', ')}) ` +
    `VALUES ${valueGroups.join(', ')} ` +
    `ON CONFLICT (${pk.map(quoteIdent).join(', ')}) ${conflictAction}`;

  await ds.query(sql, params);
}

/** Page through one source table and upsert it into the target. */
async function copyTable(
  supabase: SupabaseClient,
  ds: DataSource,
  table: { name: string; pk: string[] },
): Promise<number> {
  let copied = 0;
  const targetColumns = await getTargetColumns(ds, table.name);
  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(table.name)
      .select('*')
      .order(table.pk[0], { ascending: true })
      .range(from, to);

    if (error) {
      // Source table absent in this infoeye deployment - skip it gracefully.
      if (error.code === '42P01' || /does not exist/i.test(error.message)) {
        console.log(`  ${table.name}: skipped (not present in source)`);
        return copied;
      }
      throw new Error(`Failed reading ${table.name}: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    await upsertBatch(
      ds,
      table.name,
      table.pk,
      data as Record<string, unknown>[],
      targetColumns,
    );
    copied += data.length;
    console.log(`  ${table.name}: +${data.length} (total ${copied})`);

    if (data.length < PAGE_SIZE) break;
  }
  return copied;
}

async function main(): Promise<void> {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl =
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/x_api';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (the infoeye ' +
        'Supabase project URL and service role key).',
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  const ds = createInfofiDataSource(databaseUrl);

  console.log('Connecting to target database and syncing schema...');
  await ds.initialize();

  try {
    let grandTotal = 0;
    for (const table of TABLES) {
      console.log(`Copying ${table.name}...`);
      grandTotal += await copyTable(supabase, ds, table);
    }
    console.log(`\nDone. Copied ${grandTotal} rows across ${TABLES.length} tables.`);
  } finally {
    await ds.destroy();
  }
}

main().catch((err) => {
  console.error('\nMigration failed:', err);
  process.exit(1);
});
