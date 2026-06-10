import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { RapidApiExceptionFilter } from './common/filters/rapidapi-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new RapidApiExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Twitter API47 NestJS Wrapper')
    .setDescription(
      'A NestJS wrapper around the Twitter API47 RapidAPI service (https://rapidapi.com/restocked-gAGxip8a_/api/twitter-api47)',
    )
    .setVersion('1.0')
    .addTag('twitter')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const configService = app.get<ConfigService<AppConfig, true>>(ConfigService);
  await app.listen(configService.get('port', { infer: true }));
}
bootstrap();
