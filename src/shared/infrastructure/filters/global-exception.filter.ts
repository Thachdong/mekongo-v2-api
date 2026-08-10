import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ExceptionFilter } from '@nestjs/common';
import { DomainError } from '@shared/kernel/domain-error';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, code, message, extra } = this._resolve(exception);

    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
      );
    }

    response.status(status).json({ code, message, ...extra });
  }

  private _resolve(exception: unknown) {
    if (exception instanceof DomainError) {
      return {
        status: exception.httpStatus,
        code: exception.code,
        message: exception.message,
        extra: exception.toPayload(),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : ((body as any).message ?? exception.message);

      return {
        status,
        code: HttpStatus[status] ?? 'ERROR',
        message: Array.isArray(message) ? message.join(', ') : message,
        extra: {},
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error',
      extra: {},
    };
  }
}
