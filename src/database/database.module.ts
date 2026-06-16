import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from '../config/configuration';
import { INFOFI_ENTITIES } from '../infofi/entities';
import { SmartFollowerEntity } from '../twitter/entities/smart-follower.entity';
import { TweetEntity } from '../twitter/entities/tweet.entity';
import { UserSnapshotEntity } from '../twitter/entities/user-snapshot.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const { url } = configService.get('database', { infer: true });
        return {
          type: 'postgres' as const,
          url,
          entities: [
            UserSnapshotEntity,
            TweetEntity,
            SmartFollowerEntity,
            ...INFOFI_ENTITIES,
          ],
          synchronize: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
