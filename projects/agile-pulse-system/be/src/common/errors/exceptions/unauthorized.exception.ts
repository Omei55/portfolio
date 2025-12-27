import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';
import { ErrorCode } from '../error-codes.enum';

/**
 * Exception for unauthorized access
 */
export class UnauthorizedException extends BaseException {
  constructor(
    message: string = 'Unauthorized access',
    errorCode: ErrorCode = ErrorCode.UNAUTHORIZED,
    details?: string | string[] | Record<string, any>,
  ) {
    super(errorCode, message, HttpStatus.UNAUTHORIZED, details);
  }
}

