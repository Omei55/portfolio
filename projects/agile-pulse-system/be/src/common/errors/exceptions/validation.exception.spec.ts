import { HttpStatus } from '@nestjs/common';
import { ValidationException } from './validation.exception';
import { ErrorCode } from '../error-codes.enum';

describe('ValidationException', () => {
  it('should create validation exception with default error code', () => {
    const exception = new ValidationException('Validation failed');

    expect(exception.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
    expect(exception.message).toBe('Validation failed');
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should create validation exception with custom error code', () => {
    const exception = new ValidationException(
      'Invalid input',
      undefined,
      ErrorCode.INVALID_INPUT,
    );

    expect(exception.errorCode).toBe(ErrorCode.INVALID_INPUT);
  });

  it('should create validation exception with details', () => {
    const details = ['Field is required', 'Field must be a string'];
    const exception = new ValidationException('Validation failed', details);

    expect(exception.details).toEqual(details);
  });

  it('should create validation exception with object details', () => {
    const details = { email: 'Invalid email format', password: 'Too short' };
    const exception = new ValidationException('Validation failed', details);

    expect(exception.details).toEqual(details);
  });
});

