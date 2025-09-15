/**
 * Centralized error handling utilities
 */

import { AppError } from '../types';
import { ERROR_MESSAGES } from '../constants';

/**
 * Create a standardized error object
 */
export const createError = (
  message: string,
  code?: string,
  context?: string
): AppError => ({
  message,
  code,
  context,
  timestamp: new Date(),
});

/**
 * Handle errors with consistent logging and user feedback
 */
export const handleError = (
  error: Error | AppError | string,
  context: string = 'Unknown'
): AppError => {
  let appError: AppError;

  if (typeof error === 'string') {
    appError = createError(error, 'UNKNOWN_ERROR', context);
  } else if ('timestamp' in error) {
    // Already an AppError
    appError = error;
  } else {
    // Standard Error object
    appError = createError(error.message, error.name, context);
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`Error in ${context}:`, appError);
  }

  return appError;
};

/**
 * Handle async operations with error catching
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    const appError = handleError(error, context);
    
    // Show user-friendly error message
    const userMessage = getUserFriendlyMessage(appError.code);
    if (userMessage) {
      // You could integrate with a toast notification system here
      console.error(userMessage);
    }

    return fallback;
  }
};

/**
 * Get user-friendly error messages
 */
export const getUserFriendlyMessage = (errorCode?: string): string | null => {
  switch (errorCode) {
    case 'EXPORT_ERROR':
      return ERROR_MESSAGES.EXPORT_FAILED;
    case 'PRINT_ERROR':
      return ERROR_MESSAGES.PRINT_FAILED;
    case 'SAVE_ERROR':
      return ERROR_MESSAGES.SAVE_FAILED;
    case 'LOAD_ERROR':
      return ERROR_MESSAGES.LOAD_FAILED;
    case 'NETWORK_ERROR':
      return ERROR_MESSAGES.NETWORK_ERROR;
    case 'VALIDATION_ERROR':
      return ERROR_MESSAGES.INVALID_INPUT;
    default:
      return null;
  }
};

/**
 * Validate input with error handling
 */
export const validateInput = (
  value: any,
  validator: (value: any) => boolean,
  errorMessage: string
): void => {
  if (!validator(value)) {
    throw createError(errorMessage, 'VALIDATION_ERROR', 'InputValidation');
  }
};

/**
 * Safe JSON parsing with error handling
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch (error) {
    handleError(error, 'JSONParse');
    return fallback;
  }
};

/**
 * Safe JSON stringify with error handling
 */
export const safeJsonStringify = (obj: any, fallback: string = '{}'): string => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    handleError(error, 'JSONStringify');
    return fallback;
  }
};

/**
 * Retry mechanism with exponential backoff
 */
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: delay = baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};
