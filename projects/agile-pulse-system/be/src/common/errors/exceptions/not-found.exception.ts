import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';
import { ErrorCode } from '../error-codes.enum';

/**
 * Exception for resource not found errors
 */
export class NotFoundException extends BaseException {
  constructor(
    resourceType: string,
    identifier?: string | number,
    errorCode: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND,
  ) {
    const message = identifier
      ? `${resourceType} with identifier '${identifier}' not found`
      : `${resourceType} not found`;
    super(errorCode, message, HttpStatus.NOT_FOUND);
  }
}

