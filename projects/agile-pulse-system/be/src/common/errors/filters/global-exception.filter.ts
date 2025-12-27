import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../dto/error-response.dto';
import { BaseException } from '../exceptions/base.exception';
import { ErrorCode } from '../error-codes.enum';

/**
 * Global exception filter that catches all exceptions and transforms them
 * into standardized error responses with logging
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let errorResponse: ErrorResponseDto;
    let statusCode: HttpStatus;

    // Handle custom BaseException
    if (exception instanceof BaseException) {
      statusCode = exception.getStatus();
      errorResponse = new ErrorResponseDto(
        exception.errorCode,
        exception.message,
        statusCode,
        request.url,
        request.method,
        exception.details,
        this.getStackTrace(exception),
      );

      this.logException(exception, request, statusCode);
    }
    // Handle NestJS HttpException
    else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any)?.message || exception.message;

      // Map common NestJS exceptions to error codes
      const errorCode = this.mapHttpExceptionToErrorCode(exception, statusCode);

      errorResponse = new ErrorResponseDto(
        errorCode,
        Array.isArray(message) ? message.join(', ') : message,
        statusCode,
        request.url,
        request.method,
        typeof exceptionResponse === 'object' && !Array.isArray(exceptionResponse)
          ? exceptionResponse
          : undefined,
        this.getStackTrace(exception),
      );

      this.logException(exception, request, statusCode);
    }
    // Handle validation errors (class-validator)
    else if (
      exception &&
      typeof exception === 'object' &&
      'response' in exception &&
      typeof (exception as any).response === 'object'
    ) {
      const validationException = exception as any;
      statusCode = validationException.status || HttpStatus.BAD_REQUEST;
      const validationResponse = validationException.response;

      errorResponse = new ErrorResponseDto(
        ErrorCode.VALIDATION_ERROR,
        Array.isArray(validationResponse?.message)
          ? validationResponse.message.join(', ')
          : validationResponse?.message || 'Validation failed',
        statusCode,
        request.url,
        request.method,
        validationResponse?.message,
        this.getStackTrace(exception),
      );

      this.logException(exception, request, statusCode);
    }
    // Handle unknown errors
    else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      const errorMessage =
        exception instanceof Error
          ? exception.message
          : 'An unexpected error occurred';

      errorResponse = new ErrorResponseDto(
        ErrorCode.INTERNAL_SERVER_ERROR,
        errorMessage,
        statusCode,
        request.url,
        request.method,
        undefined,
        this.getStackTrace(exception),
      );

      this.logUnhandledException(exception, request);
    }

    // Send error response
    response.status(statusCode).json(errorResponse);
  }

  /**
   * Maps HTTP exceptions to standardized error codes
   */
  private mapHttpExceptionToErrorCode(
    exception: HttpException,
    statusCode: number,
  ): ErrorCode {
    // Check if exception has a custom error code
    if (
      exception &&
      typeof exception === 'object' &&
      'errorCode' in exception
    ) {
      return (exception as any).errorCode;
    }

    // Map by status code
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.DUPLICATE_ENTRY;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return ErrorCode.INTERNAL_SERVER_ERROR;
      default:
        return ErrorCode.UNEXPECTED_ERROR;
    }
  }

  /**
   * Logs handled exceptions with appropriate log level
   */
  private logException(
    exception: unknown,
    request: Request,
    statusCode: number,
  ): void {
    const message = `Exception caught: ${this.getExceptionMessage(exception)}`;
    const context = {
      path: request.url,
      method: request.method,
      statusCode,
      userId: (request as any).user?.user_id || (request as any).user?.sub,
    };

    if (statusCode >= 500) {
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined, context);
    } else if (statusCode >= 400) {
      this.logger.warn(message, context);
    } else {
      this.logger.debug(message, context);
    }
  }

  /**
   * Logs unhandled exceptions with full details
   */
  private logUnhandledException(exception: unknown, request: Request): void {
    const message = `Unhandled exception: ${this.getExceptionMessage(exception)}`;
    const context = {
      path: request.url,
      method: request.method,
      body: request.body,
      query: request.query,
      params: request.params,
      userId: (request as any).user?.user_id || (request as any).user?.sub,
    };

    this.logger.error(
      message,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
      context,
    );
  }

  /**
   * Gets exception message safely
   */
  private getExceptionMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.message;
    }
    if (typeof exception === 'string') {
      return exception;
    }
    return 'Unknown error';
  }

  /**
   * Gets stack trace if available and in development mode
   */
  private getStackTrace(exception: unknown): string | undefined {
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      return exception.stack;
    }
    return undefined;
  }
}

