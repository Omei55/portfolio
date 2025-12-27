import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.message || 'Http Exception';
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message || 'An error occurred';
        error = responseObj.error || exception.name || 'Http Exception';
        details = responseObj.details || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message || 'An unexpected error occurred';
      error = exception.name || 'Error';
      
      // Log unexpected errors
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      );
    }

    // Log all errors for debugging
    this.logger.error(
      `HTTP ${status} Error: ${message}`,
      {
        path: request.url,
        method: request.method,
        statusCode: status,
        error,
        details,
        timestamp: new Date().toISOString(),
      },
    );

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      ...(details && { details }),
    };

    response.status(status).json(errorResponse);
  }
}

