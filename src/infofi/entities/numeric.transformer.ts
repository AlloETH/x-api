import { ValueTransformer } from 'typeorm';

/**
 * TypeORM returns `numeric`/`decimal` columns as strings to avoid float
 * precision loss. For the leaderboard metrics (mindshare, score, etc.) we
 * want plain JS numbers in API responses, so this transformer parses on read
 * and leaves values untouched on write (Postgres accepts numbers and strings).
 */
export const numericTransformer: ValueTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null): number | null =>
    value === null || value === undefined ? null : parseFloat(value),
};
