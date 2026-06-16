import { DataSource } from 'typeorm';
import { INFOFI_ENTITIES } from './entities';

/**
 * A standalone TypeORM DataSource for the InfoFi tables, used by the one-off
 * ETL script (`scripts/migrate-infoeye.ts`) outside the Nest DI container.
 * Points at the same Postgres as the running app (`DATABASE_URL`).
 */
export function createInfofiDataSource(databaseUrl: string): DataSource {
  return new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: INFOFI_ENTITIES,
    synchronize: true,
  });
}
