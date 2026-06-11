import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
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
      [
        'A NestJS wrapper around the [Twitter API47](https://rapidapi.com/restocked-gAGxip8a_/api/twitter-api47) RapidAPI service.',
        '',
        'Every route under `/twitter/v3/...` is a thin 1:1 proxy to the ' +
          'matching upstream `/v3/...` endpoint: query parameters are ' +
          'forwarded verbatim and the upstream JSON response is returned ' +
          'unchanged. RapidAPI authentication, error translation and rate ' +
          'limiting are handled centrally - see "Errors" below.',
        '',
        'The **Analytics** endpoints (`smart-followers`, ' +
          '`paid-partnership-tweets`, `stats`) are the exception: they are ' +
          'computed locally on top of the upstream data and are not 1:1 ' +
          'upstream proxies.',
        '',
        '## Persistence',
        '',
        'User profiles and tweets fetched through this API are persisted to ' +
          'a PostgreSQL database, which powers the Analytics endpoints ' +
          '(follower growth over time, paid-partnership history, etc.). ' +
          'Persistence is best-effort and never affects the proxied response.',
        '',
        '## Errors',
        '',
        'Errors use one of the following shapes:',
        '',
        '- `400` - request validation failed (locally or upstream)',
        '- `429` - rate limited, either by this server or by the upstream ' +
          "RapidAPI plan's quota",
        '- `502` - the upstream request failed for another reason (e.g. ' +
          'invalid RapidAPI credentials)',
        '',
        'See each endpoint for example error bodies.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addTag('Users', 'User profiles, tweets, followers and following')
    .addTag(
      'Analytics',
      'Derived endpoints computed locally on top of the upstream data - ' +
        'not 1:1 upstream proxies',
    )
    .addTag('Tweets', 'Individual tweet lookups')
    .addTag('Search', 'Tweet and user search')
    .addTag('Communities', 'Twitter Communities')
    .addTag('Lists', 'Twitter Lists')
    .addTag('Spaces', 'Twitter Spaces')
    .addTag('health', 'Service health check')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    autoTagControllers: false,
  });
  SwaggerModule.setup('docs', app, document);

  app.use(
    '/reference',
    apiReference({
      content: document,
      pageTitle: 'Twitter API47 NestJS Wrapper - API Reference',
      theme: 'deepSpace',
    }),
  );

  const configService = app.get<ConfigService<AppConfig, true>>(ConfigService);
  await app.listen(configService.get('port', { infer: true }));
}
bootstrap();
