import { BadRequestException } from '@nestjs/common';
import { parsePeriodDays } from './period.util';

describe('parsePeriodDays', () => {
  it.each([
    ['7d', 7],
    ['30d', 30],
    ['3m', 90],
    ['6m', 180],
    ['1y', 365],
    ['2y', 730],
    ['1D', 1],
    ['1Y', 365],
  ])('parses "%s" as %d days', (period, expected) => {
    expect(parsePeriodDays(period)).toBe(expected);
  });

  it.each(['', '7', 'd', '7x', '-7d', '7 d'])(
    'throws BadRequestException for "%s"',
    (period) => {
      expect(() => parsePeriodDays(period)).toThrow(BadRequestException);
    },
  );
});
