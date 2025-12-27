/**
 * Standardized error response DTO
 * Provides a consistent JSON structure for all error responses
 */
export class ErrorResponseDto {
  /**
   * Indicates whether the request was successful (always false for errors)
   */
  success: boolean;

  /**
   * Standardized error code from ErrorCode enum
   */
  errorCode: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Detailed error description (optional)
   */
  details?: string | string[] | Record<string, any>;

  /**
   * HTTP status code
   */
  statusCode: number;

  /**
   * Timestamp when the error occurred
   */
  timestamp: string;

  /**
   * Request path where the error occurred
   */
  path: string;

  /**
   * Request method (GET, POST, etc.)
   */
  method: string;

  /**
   * Stack trace (only in development mode)
   */
  stack?: string;

  constructor(
    errorCode: string,
    message: string,
    statusCode: number,
    path: string,
    method: string,
    details?: string | string[] | Record<string, any>,
    stack?: string,
  ) {
    this.success = false;
    this.errorCode = errorCode;
    this.message = message;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.path = path;
    this.method = method;
    if (details) {
      this.details = details;
    }
    if (stack) {
      this.stack = stack;
    }
  }
}

