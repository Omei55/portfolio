import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';
import { ErrorCode } from '../error-codes.enum';

/**
 * Exception for resource conflicts (e.g., duplicate entries)
 */
export class ConflictException extends BaseException {
  constructor(
    message: string,
    errorCode: ErrorCode = ErrorCode.DUPLICATE_ENTRY,
    details?: string | string[] | Record<string, any>,
  ) {
    super(errorCode, message, HttpStatus.CONFLICT, details);
  }
}

