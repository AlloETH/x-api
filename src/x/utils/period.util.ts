import { BadRequestException } from '@nestjs/common';

const PERIOD_PATTERN = /^(\d+)(d|m|y)$/i;

const DAYS_PER_UNIT: Record<string, number> = {
  d: 1,
  m: 30,
  y: 365,
};

/**
 * Parses a lookback period like `7d`, `3m`, `6m`, `1y` or `2y` into a number
 * of days (`m` = 30 days, `y` = 365 days). Throws `BadRequestException` if
 * `period` doesn't match `<number><d|m|y>`.
 */
export function parsePeriodDays(period: string): number {
  const match = PERIOD_PATTERN.exec(period.trim());
  if (!match) {
    throw new BadRequestException(
      `Invalid period "${period}" - expected a number followed by d, m or y (e.g. "7d", "3m", "1y")`,
    );
  }
  const [, amount, unit] = match;
  return Number(amount) * DAYS_PER_UNIT[unit.toLowerCase()];
}
