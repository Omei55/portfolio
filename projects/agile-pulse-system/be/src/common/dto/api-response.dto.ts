/**
 * Standardized API Response DTO
 * All API responses should follow this structure to drive confirmation messages
 */
export class ApiResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;
  statusCode: number;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    statusCode: number = 200,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
  }

  static success<T>(data: T, message: string = 'Operation successful'): ApiResponseDto<T> {
    return new ApiResponseDto(true, message, data, 200);
  }

  static created<T>(data: T, message: string = 'Resource created successfully'): ApiResponseDto<T> {
    return new ApiResponseDto(true, message, data, 201);
  }

  static error(message: string, statusCode: number = 400): ApiResponseDto {
    return new ApiResponseDto(false, message, undefined, statusCode);
  }

  static noContent(message: string = 'Resource deleted successfully'): ApiResponseDto {
    return new ApiResponseDto(true, message, undefined, 204);
  }
}

