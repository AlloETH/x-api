import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/** Shared pagination + filter params for the leaderboard endpoints. */
export class LeaderboardQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by project ID (UUID).',
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by period ID (UUID).',
  })
  @IsOptional()
  @IsString()
  periodId?: string;

  @ApiPropertyOptional({
    description: 'Language code, e.g. "en". Cookie/Kaito leaderboards only.',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Max rows to return (1-500).',
    default: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 100;

  @ApiPropertyOptional({
    description: 'Rows to skip (for pagination).',
    default: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

/** Cookie leaderboard query, adds the normal-vs-capital table switch. */
export class CookieLeaderboardQueryDto extends LeaderboardQueryDto {
  @ApiPropertyOptional({
    description:
      'When "true", read from the capital leaderboard table instead of the ' +
      'standard one.',
    default: false,
  })
  @IsOptional()
  @IsBooleanString()
  capital?: string;
}

/** Wallchain leaderboard query (keyed by epoch rather than period). */
export class WallchainLeaderboardQueryDto {
  @ApiPropertyOptional({ description: 'Filter by epoch ID (UUID).' })
  @IsOptional()
  @IsString()
  epochId?: string;

  @ApiPropertyOptional({
    description: 'Max rows to return (1-500).',
    default: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 100;

  @ApiPropertyOptional({
    description: 'Rows to skip (for pagination).',
    default: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
