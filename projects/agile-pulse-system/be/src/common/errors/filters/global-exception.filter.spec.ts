import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { BaseException } from '../exceptions/base.exception';
import { ValidationException } from '../exceptions/validation.exception';
import { NotFoundException as CustomNotFoundException } from '../exceptions/not-found.exception';
import { ErrorCode } from '../error-codes.enum';
import { ErrorResponseDto } from '../dto/error-response.dto';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobalExceptionFilter],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/api/test',
      method: 'GET',
      user: { user_id: '123' },
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('BaseException handling', () => {
    it('should handle BaseException correctly', () => {
      const exception = new ValidationException('Validation failed', ['Field is required']);
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          statusCode: HttpStatus.BAD_REQUEST,
          path: '/api/test',
          method: 'GET',
          details: ['Field is required'],
        }),
      );
    });

    it('should handle NotFoundException correctly', () => {
      const exception = new CustomNotFoundException('Story', '123', ErrorCode.STORY_NOT_FOUND);
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: ErrorCode.STORY_NOT_FOUND,
          message: "Story with identifier '123' not found",
          statusCode: HttpStatus.NOT_FOUND,
        }),
      );
    });
  });

  describe('HttpException handling', () => {
    it('should handle NestJS HttpException correctly', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: ErrorCode.RESOURCE_NOT_FOUND,
          message: 'Not found',
          statusCode: HttpStatus.NOT_FOUND,
        }),
      );
    });

    it('should map HTTP status codes to error codes correctly', () => {
      const testCases = [
        { status: HttpStatus.BAD_REQUEST, expectedCode: ErrorCode.VALIDATION_ERROR },
        { status: HttpStatus.UNAUTHORIZED, expectedCode: ErrorCode.UNAUTHORIZED },
        { status: HttpStatus.FORBIDDEN, expectedCode: ErrorCode.FORBIDDEN },
        { status: HttpStatus.NOT_FOUND, expectedCode: ErrorCode.RESOURCE_NOT_FOUND },
        { status: HttpStatus.CONFLICT, expectedCode: ErrorCode.DUPLICATE_ENTRY },
        { status: HttpStatus.INTERNAL_SERVER_ERROR, expectedCode: ErrorCode.INTERNAL_SERVER_ERROR },
      ];

      testCases.forEach(({ status, expectedCode }) => {
        const exception = new HttpException('Test message', status);
        filter.catch(exception, mockArgumentsHost);
        
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            errorCode: expectedCode,
            statusCode: status,
          }),
        );
      });
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        { message: 'Custom error', code: 'CUSTOM_ERROR' },
        HttpStatus.BAD_REQUEST,
      );
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom error',
          details: { message: 'Custom error', code: 'CUSTOM_ERROR' },
        }),
      );
    });
  });

  describe('Validation errors handling', () => {
    it('should handle validation errors with array messages', () => {
      const exception = {
        response: {
          message: ['Field1 is required', 'Field2 must be a string'],
        },
        status: HttpStatus.BAD_REQUEST,
      };
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: ErrorCode.VALIDATION_ERROR,
          message: 'Field1 is required, Field2 must be a string',
          details: ['Field1 is required', 'Field2 must be a string'],
        }),
      );
    });
  });

  describe('Unknown errors handling', () => {
    it('should handle unknown errors gracefully', () => {
      const error = new Error('Unexpected error');
      
      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Unexpected error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        }),
      );
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      
      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred',
        }),
      );
    });
  });

  describe('Logging', () => {
    it('should log errors with appropriate level for 5xx errors', () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const exception = new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
      
      filter.catch(exception, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should log warnings for 4xx errors', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
      
      filter.catch(exception, mockArgumentsHost);

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('Error response structure', () => {
    it('should include all required fields in error response', () => {
      const exception = new ValidationException('Test error');
      
      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall).toHaveProperty('success', false);
      expect(responseCall).toHaveProperty('errorCode');
      expect(responseCall).toHaveProperty('message');
      expect(responseCall).toHaveProperty('statusCode');
      expect(responseCall).toHaveProperty('timestamp');
      expect(responseCall).toHaveProperty('path');
      expect(responseCall).toHaveProperty('method');
      expect(new Date(responseCall.timestamp)).toBeInstanceOf(Date);
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const exception = new Error('Test error');
      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall).toHaveProperty('stack');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const exception = new Error('Test error');
      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall.stack).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});

