import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { AppConfig } from '../config/configuration';
import { SmartFollowerEntity } from '../twitter/entities/smart-follower.entity';
import { TweetEntity } from '../twitter/entities/tweet.entity';
import { UserSnapshotEntity } from '../twitter/entities/user-snapshot.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const { path } = configService.get('database', { infer: true });
        if (path !== ':memory:') {
          mkdirSync(dirname(path), { recursive: true });
        }
        return {
          type: 'better-sqlite3' as const,
          database: path,
          entities: [UserSnapshotEntity, TweetEntity, SmartFollowerEntity],
          synchronize: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
