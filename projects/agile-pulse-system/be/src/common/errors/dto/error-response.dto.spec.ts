import { ErrorResponseDto } from './error-response.dto';
import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../error-codes.enum';

describe('ErrorResponseDto', () => {
  it('should create error response with required fields', () => {
    const errorResponse = new ErrorResponseDto(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      HttpStatus.BAD_REQUEST,
      '/api/test',
      'POST',
    );

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
    expect(errorResponse.message).toBe('Validation failed');
    expect(errorResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(errorResponse.path).toBe('/api/test');
    expect(errorResponse.method).toBe('POST');
    expect(errorResponse.timestamp).toBeDefined();
    expect(new Date(errorResponse.timestamp)).toBeInstanceOf(Date);
  });

  it('should create error response with details', () => {
    const details = ['Field is required'];
    const errorResponse = new ErrorResponseDto(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      HttpStatus.BAD_REQUEST,
      '/api/test',
      'POST',
      details,
    );

    expect(errorResponse.details).toEqual(details);
  });

  it('should create error response with object details', () => {
    const details = { field: 'email', reason: 'Invalid format' };
    const errorResponse = new ErrorResponseDto(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      HttpStatus.BAD_REQUEST,
      '/api/test',
      'POST',
      details,
    );

    expect(errorResponse.details).toEqual(details);
  });

  it('should create error response with stack trace', () => {
    const stack = 'Error: Test\n    at test.js:1:1';
    const errorResponse = new ErrorResponseDto(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Internal error',
      HttpStatus.INTERNAL_SERVER_ERROR,
      '/api/test',
      'GET',
      undefined,
      stack,
    );

    expect(errorResponse.stack).toBe(stack);
  });

  it('should not include stack trace if not provided', () => {
    const errorResponse = new ErrorResponseDto(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      HttpStatus.BAD_REQUEST,
      '/api/test',
      'POST',
    );

    expect(errorResponse.stack).toBeUndefined();
  });
});

