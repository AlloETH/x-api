import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TrendsQueryDto {
  @ApiPropertyOptional({
    description:
      'Yahoo! WOEID (Where On Earth ID) of the location to fetch trends for. Defaults to worldwide.',
    example: '1',
  })
  @IsOptional()
  @IsString()
  woeid?: string;
}
