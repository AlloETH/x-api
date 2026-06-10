import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from '../../common/dto/cursor-pagination.dto';

export enum TwitterSearchType {
  TOP = 'Top',
  LATEST = 'Latest',
  PEOPLE = 'People',
  PHOTOS = 'Photos',
  VIDEOS = 'Videos',
}

export class SearchQueryDto extends CursorPaginationDto {
  @ApiProperty({
    description:
      'Search query, supports the standard Twitter search operators.',
    example: 'nestjs lang:en',
  })
  @IsString()
  @IsNotEmpty()
  query!: string;

  @ApiPropertyOptional({
    enum: TwitterSearchType,
    default: TwitterSearchType.TOP,
    description: 'Category of search results to return.',
  })
  @IsOptional()
  @IsEnum(TwitterSearchType)
  searchType?: TwitterSearchType;
}
