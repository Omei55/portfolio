/**
 * Error Handler Utility
 * Centralized error handling for consistent error messages and logging
 */

/**
 * Extract error message from various error types
 * @param {Error|string|Object} error - The error object
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) {
    return 'An unexpected error occurred';
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If it's an Error object
  if (error instanceof Error) {
    return error.message || 'An error occurred';
  }

  // If it's an object with a message property
  if (error.message) {
    return error.message;
  }

  // If it's an object with a response (API error)
  if (error.response) {
    const responseData = error.response.data || error.response;
    if (responseData.message) {
      return responseData.message;
    }
    if (typeof responseData === 'string') {
      return responseData;
    }
  }

  // If it's an object with statusText
  if (error.statusText) {
    return error.statusText;
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Extract HTTP status code from error
 * @param {Error|Object} error - The error object
 * @returns {number|null} HTTP status code
 */
export const getErrorStatus = (error) => {
  if (!error) {
    return null;
  }

  if (error.status) {
    return error.status;
  }

  if (error.response && error.response.status) {
    return error.response.status;
  }

  if (error.response && error.response.statusCode) {
    return error.response.statusCode;
  }

  return null;
};

/**
 * Get user-friendly error message based on status code
 * @param {number} statusCode - HTTP status code
 * @param {string} defaultMessage - Default error message
 * @returns {string} User-friendly error message
 */
export const getStatusMessage = (statusCode, defaultMessage = '') => {
  const statusMessages = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'You are not authorized. Please log in and try again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'A conflict occurred. The resource may already exist.',
    422: 'Validation failed. Please check your input.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    502: 'Bad gateway. The server is temporarily unavailable.',
    503: 'Service unavailable. Please try again later.',
    504: 'Gateway timeout. The server took too long to respond.',
  };

  return statusMessages[statusCode] || defaultMessage || 'An error occurred';
};

/**
 * Log error for debugging
 * @param {Error|Object} error - The error object
 * @param {string} context - Context where the error occurred
 * @param {Object} additionalInfo - Additional information to log
 */
export const logError = (error, context = 'Application', additionalInfo = {}) => {
  const errorMessage = getErrorMessage(error);
  const statusCode = getErrorStatus(error);
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] Error in ${context}:`, {
    message: errorMessage,
    statusCode,
    error: error instanceof Error ? error.stack : error,
    ...additionalInfo,
  });

  // In production, you might want to send this to an error tracking service
  // e.g., Sentry, LogRocket, etc.
};

/**
 * Handle API error response
 * @param {Response} response - Fetch response object
 * @returns {Promise<Error>} Error object with details
 */
export const handleApiError = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let errorData;
  try {
    errorData = isJson ? await response.json() : await response.text();
  } catch (parseError) {
    errorData = response.statusText || 'Unknown error';
  }

  const errorMessage =
    (isJson && errorData?.message) ||
    (typeof errorData === 'string' ? errorData : null) ||
    errorData?.error ||
    response.statusText ||
    getStatusMessage(response.status);

  const error = new Error(errorMessage);
  error.status = response.status;
  error.statusCode = response.status;
  error.response = errorData;
  error.originalResponse = response;

  return error;
};

/**
 * Create a standardized error object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Additional error details
 * @returns {Object} Standardized error object
 */
export const createError = (message, statusCode = 500, details = {}) => {
  return {
    message,
    statusCode,
    status: statusCode,
    timestamp: new Date().toISOString(),
    ...details,
  };
};

/**
 * Check if error is a network error
 * @param {Error|Object} error - The error object
 * @returns {boolean} True if it's a network error
 */
export const isNetworkError = (error) => {
  if (!error) return false;
  
  // Check for common network error messages
  const networkErrorMessages = [
    'network',
    'fetch',
    'connection',
    'timeout',
    'failed to fetch',
    'networkerror',
  ];

  const errorMessage = getErrorMessage(error).toLowerCase();
  return networkErrorMessages.some((msg) => errorMessage.includes(msg));
};

/**
 * Check if error is a validation error
 * @param {Error|Object} error - The error object
 * @returns {boolean} True if it's a validation error
 */
export const isValidationError = (error) => {
  if (!error) return false;
  
  const statusCode = getErrorStatus(error);
  return statusCode === 400 || statusCode === 422;
};

/**
 * Format validation errors from API response
 * @param {Object} errorResponse - API error response
 * @returns {Object} Formatted validation errors by field
 */
export const formatValidationErrors = (errorResponse) => {
  if (!errorResponse) return {};

  // Handle NestJS validation error format
  if (Array.isArray(errorResponse.message)) {
    const errors = {};
    errorResponse.message.forEach((msg) => {
      // Extract field name from messages like "title should not be empty"
      const match = msg.match(/^(\w+)\s/);
      if (match) {
        const field = match[1];
        errors[field] = msg;
      } else {
        errors.general = msg;
      }
    });
    return errors;
  }

  // Handle details object
  if (errorResponse.details && typeof errorResponse.details === 'object') {
    return errorResponse.details;
  }

  return {};
};

