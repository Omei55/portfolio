import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../error-codes.enum';

/**
 * Base exception class for all custom exceptions
 * Extends NestJS HttpException with standardized error codes
 */
export class BaseException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly details?: string | string[] | Record<string, any>;

  constructor(
    errorCode: ErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: string | string[] | Record<string, any>,
  ) {
    super(message, statusCode);
    this.errorCode = errorCode;
    this.details = details;
  }
}

