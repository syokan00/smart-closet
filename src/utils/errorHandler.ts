import { Alert } from 'react-native';

/**
 * Error types for categorization
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  STORAGE = 'STORAGE',
  NETWORK = 'NETWORK',
  PERMISSION = 'PERMISSION',
  FILE_SYSTEM = 'FILE_SYSTEM',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error log entry
 */
interface ErrorLogEntry {
  type: ErrorType;
  message: string;
  context: string;
  timestamp: number;
  details?: any;
}

/**
 * Error handler class
 */
class ErrorHandler {
  private errorLog: ErrorLogEntry[] = [];
  private readonly MAX_LOG_SIZE = 100;

  /**
   * Log an error without showing to user
   */
  logError(
    error: Error | string,
    context: string,
    type: ErrorType = ErrorType.UNKNOWN,
    details?: any
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;

    // Create sanitized log entry (no sensitive info)
    const logEntry: ErrorLogEntry = {
      type,
      message: this.sanitizeErrorMessage(errorMessage),
      context,
      timestamp: Date.now(),
      details: this.sanitizeDetails(details),
    };

    // Add to log
    this.errorLog.push(logEntry);

    // Keep log size manageable
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (__DEV__) {
      console.error(`[${type}] ${context}:`, errorMessage, details);
    }
  }

  /**
   * Handle error with user notification
   */
  handleError(
    error: Error | string,
    userMessage: string,
    context: string,
    type: ErrorType = ErrorType.UNKNOWN
  ): void {
    this.logError(error, context, type);
    Alert.alert('错误', userMessage);
  }

  /**
   * Handle validation error
   */
  handleValidationError(field: string, userMessage: string): void {
    this.logError(
      `Validation failed for ${field}`,
      'Validation',
      ErrorType.VALIDATION
    );
    Alert.alert('输入错误', userMessage);
  }

  /**
   * Handle storage error
   */
  handleStorageError(operation: string, error: Error): void {
    this.logError(error, `Storage: ${operation}`, ErrorType.STORAGE);
    Alert.alert('存储错误', '无法保存数据,请稍后重试');
  }

  /**
   * Handle network error
   */
  handleNetworkError(error: Error): void {
    this.logError(error, 'Network', ErrorType.NETWORK);
    Alert.alert('网络错误', '请检查网络连接后重试');
  }

  /**
   * Handle permission error
   */
  handlePermissionError(permission: string): void {
    this.logError(
      `Permission denied: ${permission}`,
      'Permissions',
      ErrorType.PERMISSION
    );
    Alert.alert(
      '权限不足',
      `需要${permission}权限才能继续操作,请在设置中允许该权限`
    );
  }

  /**
   * Handle rate limit error
   */
  handleRateLimitError(action: string, resetTimeMs: number): void {
    this.logError(
      `Rate limit exceeded for ${action}`,
      'RateLimit',
      ErrorType.RATE_LIMIT
    );
    
    const resetSeconds = Math.ceil(resetTimeMs / 1000);
    Alert.alert(
      '操作过于频繁',
      `请在 ${resetSeconds} 秒后重试`
    );
  }

  /**
   * Get error logs
   */
  getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {
      [ErrorType.VALIDATION]: 0,
      [ErrorType.STORAGE]: 0,
      [ErrorType.NETWORK]: 0,
      [ErrorType.PERMISSION]: 0,
      [ErrorType.FILE_SYSTEM]: 0,
      [ErrorType.RATE_LIMIT]: 0,
      [ErrorType.UNKNOWN]: 0,
    };

    for (const entry of this.errorLog) {
      stats[entry.type]++;
    }

    return stats;
  }

  /**
   * Sanitize error message (remove sensitive info)
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove potential file paths
    let sanitized = message.replace(/[A-Z]:\\[^\s]*/g, '[PATH]');
    sanitized = sanitized.replace(/\/[^\s]*/g, '[PATH]');
    
    // Remove potential URLs
    sanitized = sanitized.replace(/https?:\/\/[^\s]*/g, '[URL]');
    
    // Remove potential tokens or keys
    sanitized = sanitized.replace(/[a-zA-Z0-9]{32,}/g, '[TOKEN]');
    
    return sanitized;
  }

  /**
   * Sanitize error details
   */
  private sanitizeDetails(details: any): any {
    if (!details) return undefined;
    
    // Don't log large objects
    if (typeof details === 'object') {
      const stringified = JSON.stringify(details);
      if (stringified.length > 1000) {
        return '[LARGE_OBJECT]';
      }
    }
    
    return details;
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();
