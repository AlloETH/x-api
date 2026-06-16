import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { AppConfig } from '../../config/configuration';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export const API_KEY_HEADER = 'x-api-key';

/**
 * Global guard that requires a valid API key on every request, supplied via
 * the `X-API-Key` header. Routes decorated with `@Public()` are exempt.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly apiKeys: string[];

  constructor(
    private readonly reflector: Reflector,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.apiKeys = configService.get('apiKeys', { infer: true });
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header(API_KEY_HEADER);

    if (!provided || !this.isValidKey(provided)) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }

  /**
   * Constant-time comparison against each configured key to avoid leaking
   * key material through timing differences.
   */
  private isValidKey(provided: string): boolean {
    const providedBuffer = Buffer.from(provided);
    return this.apiKeys.some((key) => {
      const keyBuffer = Buffer.from(key);
      return (
        keyBuffer.length === providedBuffer.length &&
        timingSafeEqual(keyBuffer, providedBuffer)
      );
    });
  }
}
