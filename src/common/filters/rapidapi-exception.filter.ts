import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AxiosError } from 'axios';

/**
 * Translates errors raised by the upstream Twitter API47 (RapidAPI) service
 * into NestJS HTTP exceptions with a consistent error shape.
 */
@Catch(AxiosError, HttpException)
export class RapidApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RapidApiExceptionFilter.name);

  catch(exception: AxiosError | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response
        .status(status)
        .json(
          typeof body === 'string'
            ? { statusCode: status, message: body }
            : body,
        );
      return;
    }

    const status = exception.response?.status ?? HttpStatus.BAD_GATEWAY;
    const upstreamMessage =
      (exception.response?.data as { message?: string } | undefined)?.message ??
      exception.message;

    this.logger.error(
      `Upstream Twitter API47 request failed: ${status} ${upstreamMessage}`,
    );

    response.status(this.mapStatus(status)).json({
      statusCode: this.mapStatus(status),
      message: 'Twitter API47 upstream request failed',
      upstreamStatus: status,
      upstreamMessage,
    });
  }

  private mapStatus(upstreamStatus: number): number {
    if (upstreamStatus === HttpStatus.TOO_MANY_REQUESTS) {
      return HttpStatus.TOO_MANY_REQUESTS;
    }
    if (
      upstreamStatus === HttpStatus.UNAUTHORIZED ||
      upstreamStatus === HttpStatus.FORBIDDEN
    ) {
      return HttpStatus.BAD_GATEWAY;
    }
    if (upstreamStatus >= 400 && upstreamStatus < 500) {
      return upstreamStatus;
    }
    return HttpStatus.BAD_GATEWAY;
  }
}
