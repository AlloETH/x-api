import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { UpstreamExceptionFilter } from './common/filters/upstream-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new UpstreamExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('X Data API')
    .setDescription(
      [
        'A NestJS wrapper around an upstream X data API.',
        '',
        'Every route under `/x/v3/...` is a thin 1:1 proxy to the ' +
          'matching upstream `/v3/...` endpoint: query parameters are ' +
          'forwarded verbatim and the upstream JSON response is returned ' +
          'unchanged. Upstream authentication, error translation and rate ' +
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
          "API plan's quota",
        '- `502` - the upstream request failed for another reason (e.g. ' +
          'invalid upstream API credentials)',
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
    .addTag('Communities', 'X Communities')
    .addTag('Lists', 'X Lists')
    .addTag('Spaces', 'X Spaces')
    .addTag(
      'InfoFi',
      'Users and leaderboards (cookie, kaito, wallchain) migrated from infoeye',
    )
    .addTag('health', 'Service health check')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key required on every request except `/health`.',
      },
      'api-key',
    )
    .addSecurityRequirements('api-key')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    autoTagControllers: false,
  });
  SwaggerModule.setup('docs', app, document, { swaggerUiEnabled: false });

  app.use(
    '/docs',
    apiReference({
      content: document,
      pageTitle: 'X Data API - Reference',
      theme: 'deepSpace',
    }),
  );

  const configService = app.get<ConfigService<AppConfig, true>>(ConfigService);
  await app.listen(configService.get('port', { infer: true }));
}
bootstrap();
