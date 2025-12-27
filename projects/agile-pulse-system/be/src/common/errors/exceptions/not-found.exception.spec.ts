import { HttpStatus } from '@nestjs/common';
import { NotFoundException } from './not-found.exception';
import { ErrorCode } from '../error-codes.enum';

describe('NotFoundException', () => {
  it('should create not found exception with identifier', () => {
    const exception = new NotFoundException('Story', '123');

    expect(exception.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    expect(exception.message).toBe("Story with identifier '123' not found");
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('should create not found exception without identifier', () => {
    const exception = new NotFoundException('Story');

    expect(exception.message).toBe('Story not found');
  });

  it('should create not found exception with custom error code', () => {
    const exception = new NotFoundException(
      'Story',
      '123',
      ErrorCode.STORY_NOT_FOUND,
    );

    expect(exception.errorCode).toBe(ErrorCode.STORY_NOT_FOUND);
  });

  it('should handle numeric identifiers', () => {
    const exception = new NotFoundException('User', 456);

    expect(exception.message).toBe("User with identifier '456' not found");
  });
});

