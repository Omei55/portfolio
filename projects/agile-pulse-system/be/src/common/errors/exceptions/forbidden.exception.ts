import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';
import { ErrorCode } from '../error-codes.enum';

/**
 * Exception for forbidden access (insufficient permissions)
 */
export class ForbiddenException extends BaseException {
  constructor(
    message: string = 'Forbidden: Insufficient permissions',
    errorCode: ErrorCode = ErrorCode.FORBIDDEN,
    details?: string | string[] | Record<string, any>,
  ) {
    super(errorCode, message, HttpStatus.FORBIDDEN, details);
  }
}

