import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Shared cursor-based pagination query params used by most
 * Twitter API47 list endpoints (timelines, followers, search, etc.).
 */
export class CursorPaginationDto {
  @ApiPropertyOptional({
    description:
      'Pagination cursor returned by a previous call, used to fetch the next page of results.',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
