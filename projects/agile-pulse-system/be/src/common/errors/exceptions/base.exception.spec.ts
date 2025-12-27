import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';
import { ErrorCode } from '../error-codes.enum';

describe('BaseException', () => {
  it('should create exception with default values', () => {
    const exception = new BaseException(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Test error',
    );

    expect(exception.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    expect(exception.message).toBe('Test error');
    expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(exception.details).toBeUndefined();
  });

  it('should create exception with custom status code', () => {
    const exception = new BaseException(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      HttpStatus.BAD_REQUEST,
    );

    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should create exception with details', () => {
    const details = { field: 'email', reason: 'Invalid format' };
    const exception = new BaseException(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      HttpStatus.BAD_REQUEST,
      details,
    );

    expect(exception.details).toEqual(details);
  });

  it('should create exception with array details', () => {
    const details = ['Error 1', 'Error 2'];
    const exception = new BaseException(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      HttpStatus.BAD_REQUEST,
      details,
    );

    expect(exception.details).toEqual(details);
  });

  it('should be instance of HttpException', () => {
    const exception = new BaseException(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Test error',
    );

    expect(exception).toBeInstanceOf(Error);
  });
});

