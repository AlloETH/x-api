import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { TwitterController } from './twitter.controller';
import { TwitterService } from './twitter.service';

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
  ],
  controllers: [TwitterController],
  providers: [TwitterService],
  exports: [TwitterService],
})
export class TwitterModule {}
