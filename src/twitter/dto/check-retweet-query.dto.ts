import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckRetweetQueryDto {
  @ApiProperty({
    description: 'ID of the user to check for a retweet of the given tweet.',
    example: '44196397',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
