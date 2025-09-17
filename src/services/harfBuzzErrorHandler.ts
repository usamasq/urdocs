/**
 * HarfBuzz Error Handler
 * 
 * This service provides standardized error handling for HarfBuzz operations,
 * ensuring consistent error reporting and graceful fallback behavior.
 */

export enum HarfBuzzErrorType {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  FONT_LOADING_FAILED = 'FONT_LOADING_FAILED',
  TEXT_SHAPING_FAILED = 'TEXT_SHAPING_FAILED',
  PDF_GENERATION_FAILED = 'PDF_GENERATION_FAILED',
  FONT_NOT_AVAILABLE = 'FONT_NOT_AVAILABLE',
  INVALID_INPUT = 'INVALID_INPUT',
  MEMORY_ERROR = 'MEMORY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface HarfBuzzError {
  type: HarfBuzzErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  recoverable: boolean;
  fallbackAvailable: boolean;
}

export class HarfBuzzErrorHandler {
  private static instance: HarfBuzzErrorHandler;
  private errorLog: HarfBuzzError[] = [];
  private maxLogSize = 100;

  private constructor() {}

  public static getInstance(): HarfBuzzErrorHandler {
    if (!HarfBuzzErrorHandler.instance) {
      HarfBuzzErrorHandler.instance = new HarfBuzzErrorHandler();
    }
    return HarfBuzzErrorHandler.instance;
  }

  /**
   * Create a standardized error from various error sources
   */
  public createError(
    type: HarfBuzzErrorType,
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ): HarfBuzzError {
    const error: HarfBuzzError = {
      type,
      message,
      originalError,
      context,
      recoverable: this.isRecoverable(type),
      fallbackAvailable: this.hasFallback(type)
    };

    this.logError(error);
    return error;
  }

  /**
   * Handle initialization errors
   */
  public handleInitializationError(error: Error, context?: Record<string, any>): HarfBuzzError {
    return this.createError(
      HarfBuzzErrorType.INITIALIZATION_FAILED,
      'Failed to initialize HarfBuzz service',
      error,
      context
    );
  }

  /**
   * Handle font loading errors
   */
  public handleFontLoadingError(
    fontName: string,
    error: Error,
    context?: Record<string, any>
  ): HarfBuzzError {
    return this.createError(
      HarfBuzzErrorType.FONT_LOADING_FAILED,
      `Failed to load font: ${fontName}`,
      error,
      { fontName, ...context }
    );
  }

  /**
   * Handle text shaping errors
   */
  public handleTextShapingError(
    text: string,
    fontName: string,
    error: Error,
    context?: Record<string, any>
  ): HarfBuzzError {
    return this.createError(
      HarfBuzzErrorType.TEXT_SHAPING_FAILED,
      'Text shaping failed',
      error,
      { 
        textLength: text.length, 
        fontName,
        textPreview: text.substring(0, 50),
        ...context 
      }
    );
  }

  /**
   * Handle PDF generation errors
   */
  public handlePdfGenerationError(
    error: Error,
    context?: Record<string, any>
  ): HarfBuzzError {
    return this.createError(
      HarfBuzzErrorType.PDF_GENERATION_FAILED,
      'PDF generation failed',
      error,
      context
    );
  }

  /**
   * Handle font availability errors
   */
  public handleFontNotAvailableError(
    fontName: string,
    context?: Record<string, any>
  ): HarfBuzzError {
    return this.createError(
      HarfBuzzErrorType.FONT_NOT_AVAILABLE,
      `Font not available: ${fontName}`,
      undefined,
      { fontName, ...context }
    );
  }

  /**
   * Handle invalid input errors
   */
  public handleInvalidInputError(
    input: any,
    expectedType: string,
    context?: Record<string, any>
  ): HarfBuzzError {
    return this.createError(
      HarfBuzzErrorType.INVALID_INPUT,
      `Invalid input: expected ${expectedType}`,
      undefined,
      { input, expectedType, ...context }
    );
  }

  /**
   * Check if error type is recoverable
   */
  private isRecoverable(type: HarfBuzzErrorType): boolean {
    const recoverableTypes = [
      HarfBuzzErrorType.FONT_LOADING_FAILED,
      HarfBuzzErrorType.TEXT_SHAPING_FAILED,
      HarfBuzzErrorType.FONT_NOT_AVAILABLE,
      HarfBuzzErrorType.INVALID_INPUT
    ];
    return recoverableTypes.includes(type);
  }

  /**
   * Check if error type has fallback available
   */
  private hasFallback(type: HarfBuzzErrorType): boolean {
    const fallbackTypes = [
      HarfBuzzErrorType.INITIALIZATION_FAILED,
      HarfBuzzErrorType.FONT_LOADING_FAILED,
      HarfBuzzErrorType.TEXT_SHAPING_FAILED,
      HarfBuzzErrorType.FONT_NOT_AVAILABLE
    ];
    return fallbackTypes.includes(type);
  }

  /**
   * Log error for debugging and monitoring
   */
  private logError(error: HarfBuzzError): void {
    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console with appropriate level
    if (error.type === HarfBuzzErrorType.INITIALIZATION_FAILED) {
      console.error('HarfBuzz Error:', error);
    } else {
      console.warn('HarfBuzz Warning:', error);
    }
  }

  /**
   * Get recent errors
   */
  public getRecentErrors(limit: number = 10): HarfBuzzError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Get errors by type
   */
  public getErrorsByType(type: HarfBuzzErrorType): HarfBuzzError[] {
    return this.errorLog.filter(error => error.type === type);
  }

  /**
   * Clear error log
   */
  public clearErrors(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): Record<HarfBuzzErrorType, number> {
    const stats: Record<HarfBuzzErrorType, number> = {} as Record<HarfBuzzErrorType, number>;
    
    // Initialize all types with 0
    Object.values(HarfBuzzErrorType).forEach(type => {
      stats[type] = 0;
    });

    // Count errors by type
    this.errorLog.forEach(error => {
      stats[error.type]++;
    });

    return stats;
  }

  /**
   * Check if errors indicate a serious problem
   */
  public hasSeriousErrors(): boolean {
    const seriousTypes = [
      HarfBuzzErrorType.INITIALIZATION_FAILED,
      HarfBuzzErrorType.MEMORY_ERROR,
      HarfBuzzErrorType.NETWORK_ERROR
    ];

    return this.errorLog.some(error => seriousTypes.includes(error.type));
  }

  /**
   * Get user-friendly error message
   */
  public getUserFriendlyMessage(error: HarfBuzzError): string {
    switch (error.type) {
      case HarfBuzzErrorType.INITIALIZATION_FAILED:
        return 'HarfBuzz initialization failed. Using fallback mode.';
      case HarfBuzzErrorType.FONT_LOADING_FAILED:
        return 'Font loading failed. Using default font.';
      case HarfBuzzErrorType.TEXT_SHAPING_FAILED:
        return 'Text shaping failed. Using basic formatting.';
      case HarfBuzzErrorType.FONT_NOT_AVAILABLE:
        return 'Font not available. Using fallback font.';
      case HarfBuzzErrorType.INVALID_INPUT:
        return 'Invalid input provided. Please check your text.';
      case HarfBuzzErrorType.PDF_GENERATION_FAILED:
        return 'PDF generation failed. Please try again.';
      case HarfBuzzErrorType.MEMORY_ERROR:
        return 'Memory error occurred. Please try with less content.';
      case HarfBuzzErrorType.NETWORK_ERROR:
        return 'Network error occurred. Please check your connection.';
      default:
        return 'An unexpected error occurred. Using fallback mode.';
    }
  }

  /**
   * Check if system should continue with fallback
   */
  public shouldUseFallback(error: HarfBuzzError): boolean {
    return error.fallbackAvailable && !this.hasSeriousErrors();
  }
}

// Export singleton instance
export const harfBuzzErrorHandler = HarfBuzzErrorHandler.getInstance();
export default harfBuzzErrorHandler;

