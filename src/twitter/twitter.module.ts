import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from '../config/configuration';
import { SmartFollowerEntity } from './entities/smart-follower.entity';
import { TweetEntity } from './entities/tweet.entity';
import { UserSnapshotEntity } from './entities/user-snapshot.entity';
import { TwitterController } from './twitter.controller';
import { TwitterService } from './twitter.service';
import { TwitterStorageService } from './twitter-storage.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const rapidApi = configService.get('rapidApi', { infer: true });
        return {
          baseURL: rapidApi.baseUrl,
          timeout: rapidApi.timeout,
          headers: {
            'x-rapidapi-key': rapidApi.key,
            'x-rapidapi-host': rapidApi.host,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([
      UserSnapshotEntity,
      TweetEntity,
      SmartFollowerEntity,
    ]),
  ],
  controllers: [TwitterController],
  providers: [TwitterService, TwitterStorageService],
  exports: [TwitterService],
})
export class TwitterModule {}
