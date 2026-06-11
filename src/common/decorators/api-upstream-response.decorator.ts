import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

/**
 * Documents the error response shapes that every route in this API can
 * return, on top of its own `@ApiOkResponse`:
 *
 * - `400` - the request failed NestJS's global `ValidationPipe` (e.g. an
 *   unknown query parameter, since `forbidNonWhitelisted` is enabled), a
 *   route-specific validation such as an invalid `period`, or the upstream
 *   Twitter API47 rejected the request as invalid
 *   (`RapidApiExceptionFilter` passthrough).
 * - `429` - either this server's own rate limit (`ThrottlerGuard`,
 *   configured via `THROTTLE_TTL` / `THROTTLE_LIMIT`) or the upstream
 *   RapidAPI plan's quota has been exhausted.
 * - `502` - the upstream Twitter API47 request failed for any other reason
 *   (including invalid/expired RapidAPI credentials).
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
        'reached the upstream API, or the upstream Twitter API47 rejected ' +
        'it as invalid.',
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
                message: 'Twitter API47 upstream request failed',
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
        "RapidAPI plan's monthly quota has been exhausted.",
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
              summary: "Upstream RapidAPI plan's quota exhausted",
              value: {
                statusCode: 429,
                message: 'Twitter API47 upstream request failed',
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
        'The upstream Twitter API47 request failed for a reason other than ' +
        'invalid input or rate limiting (e.g. invalid/expired RapidAPI ' +
        'credentials, or an unexpected upstream error).',
      content: {
        'application/json': {
          example: {
            statusCode: 502,
            message: 'Twitter API47 upstream request failed',
            upstreamStatus: 403,
            upstreamMessage: 'Forbidden',
          },
        },
      },
    }),
  );
}
