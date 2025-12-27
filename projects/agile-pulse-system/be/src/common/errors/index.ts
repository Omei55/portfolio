/**
 * Centralized error handling module
 * 
 * This module provides:
 * - Custom exception classes for different error types
 * - Standardized error response format
 * - Global exception filter with logging
 * - Error code enumeration for consistent error identification
 * 
 * Usage:
 * ```typescript
 * import { NotFoundException, ErrorCode } from '../common/errors';
 * 
 * throw new NotFoundException('Story', id, ErrorCode.STORY_NOT_FOUND);
 * ```
 */

// Error codes
export { ErrorCode } from './error-codes.enum';

// Error response DTO
export { ErrorResponseDto } from './dto/error-response.dto';

// Exception classes
export * from './exceptions';

// Exception filters
export * from './filters';

