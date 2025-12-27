import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';
import { ErrorCode } from '../error-codes.enum';

/**
 * Exception for validation errors
 */
export class ValidationException extends BaseException {
  constructor(
    message: string,
    details?: string | string[] | Record<string, any>,
    errorCode: ErrorCode = ErrorCode.VALIDATION_ERROR,
  ) {
    super(errorCode, message, HttpStatus.BAD_REQUEST, details);
  }
}

