import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';
import { ErrorCode } from '../error-codes.enum';

/**
 * Exception for business logic violations
 */
export class BusinessException extends BaseException {
  constructor(
    message: string,
    errorCode: ErrorCode = ErrorCode.BUSINESS_RULE_VIOLATION,
    details?: string | string[] | Record<string, any>,
  ) {
    super(errorCode, message, HttpStatus.BAD_REQUEST, details);
  }
}

