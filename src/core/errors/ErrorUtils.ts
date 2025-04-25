import { AppError } from './AppError';

export class ErrorUtils {
  /**
   * Format error chain for logging
   */
  static formatErrorChain(error: Error, includeStack: boolean = false): string {
    let result = '';

    if (error instanceof AppError) {
      result = `AppError: ${error.message} [${error.statusCode}] [${error.errorCode}]`;

      if (includeStack && error.stack) {
        result += `\nStack: ${error.stack.split('\n').slice(0, 3).join('\n')}`;
      }

      if (error.cause) {
        result += '\nCaused by: ' + this.formatErrorChain(error.cause, includeStack);
      }
    } else {
      result = `${error.name}: ${error.message}`;

      if (includeStack && error.stack) {
        result += `\nStack: ${error.stack.split('\n').slice(0, 3).join('\n')}`;
      }
    }

    return result;
  }

  /**
   * Get root cause of an error chain
   */
  static getRootCause(error: Error): Error {
    if (error instanceof AppError && error.cause) {
      return this.getRootCause(error.cause);
    }
    return error;
  }
}
