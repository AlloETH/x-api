import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

/**
 * Documents the error response shapes that every route in this API can
 * return, on top of its own `@ApiOkResponse`:
 *
 * - `400` - the request failed NestJS's global `ValidationPipe` (e.g. an
 *   unknown query parameter, since `forbidNonWhitelisted` is enabled), a
 *   route-specific validation such as an invalid `period`, or the upstream
 *   API rejected the request as invalid
 *   (`UpstreamExceptionFilter` passthrough).
 * - `429` - either this server's own rate limit (`ThrottlerGuard`,
 *   configured via `THROTTLE_TTL` / `THROTTLE_LIMIT`) or the upstream
 *   API plan's quota has been exhausted.
 * - `502` - the upstream API request failed for any other reason
 *   (including invalid/expired upstream API credentials).
 *
 * Apply once at the controller level so it documents every route in
 * `TwitterController`.
 */
export function ApiUpstreamErrorResponses() {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description:
        'Bad request - either this server rejected the request before it ' +
        'reached the upstream API, or the upstream API rejected it as ' +
        'invalid.',
      content: {
        'application/json': {
          examples: {
            validation: {
              summary: 'Failed local request validation',
              value: {
                statusCode: 400,
                message: ['property foo should not exist'],
                error: 'Bad Request',
              },
            },
            invalidPeriod: {
              summary: 'Invalid `period` query parameter',
              value: {
                statusCode: 400,
                message:
                  'Invalid period "10x" - expected a number followed by d, m or y (e.g. "7d", "3m", "1y")',
                error: 'Bad Request',
              },
            },
            upstreamValidation: {
              summary: 'Upstream rejected the request as invalid',
              value: {
                statusCode: 400,
                message: 'Upstream API request failed',
                upstreamStatus: 400,
                upstreamMessage: 'Request failed with status code 400',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 429,
      description:
        "Too many requests - either this server's own rate limit " +
        '(`THROTTLE_TTL` / `THROTTLE_LIMIT`) was exceeded, or the upstream ' +
        "API plan's monthly quota has been exhausted.",
      content: {
        'application/json': {
          examples: {
            localThrottle: {
              summary: "This server's rate limit was exceeded",
              value: {
                statusCode: 429,
                message: 'ThrottlerException: Too Many Requests',
              },
            },
            upstreamQuota: {
              summary: "Upstream API plan's quota exhausted",
              value: {
                statusCode: 429,
                message: 'Upstream API request failed',
                upstreamStatus: 429,
                upstreamMessage:
                  'You have exceeded the MONTHLY quota for Requests on your current plan, BASIC. Upgrade your plan to ' +
                  'get access to a higher quota.',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 502,
      description:
        'The upstream API request failed for a reason other than invalid ' +
        'input or rate limiting (e.g. invalid/expired upstream API ' +
        'credentials, or an unexpected upstream error).',
      content: {
        'application/json': {
          example: {
            statusCode: 502,
            message: 'Upstream API request failed',
            upstreamStatus: 403,
            upstreamMessage: 'Forbidden',
          },
        },
      },
    }),
  );
}
