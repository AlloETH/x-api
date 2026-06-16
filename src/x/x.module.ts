import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from '../config/configuration';
import { SmartFollowerEntity } from './entities/smart-follower.entity';
import { TweetEntity } from './entities/tweet.entity';
import { UserSnapshotEntity } from './entities/user-snapshot.entity';
import { XController } from './x.controller';
import { XService } from './x.service';
import { XStorageService } from './x-storage.service';

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
  controllers: [XController],
  providers: [XService, XStorageService],
  exports: [XService],
})
export class XModule {}
