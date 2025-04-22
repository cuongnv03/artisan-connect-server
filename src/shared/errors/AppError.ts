/**
 * Custom Error class cho ứng dụng
 *
 * Cung cấp thông tin chi tiết về lỗi và hỗ trợ xử lý lỗi nhất quán
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'SERVER_ERROR',
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

    // Để stack trace bắt đầu tại vị trí tạo Error
    Error.captureStackTrace(this, this.constructor);

    // Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Factory methods for common error types
   */
  static badRequest(message: string = 'Bad request', errorCode: string = 'BAD_REQUEST'): AppError {
    return new AppError(message, 400, errorCode);
  }

  static unauthorized(
    message: string = 'Unauthorized',
    errorCode: string = 'UNAUTHORIZED',
  ): AppError {
    return new AppError(message, 401, errorCode);
  }

  static forbidden(message: string = 'Forbidden', errorCode: string = 'FORBIDDEN'): AppError {
    return new AppError(message, 403, errorCode);
  }

  static notFound(
    message: string = 'Resource not found',
    errorCode: string = 'NOT_FOUND',
  ): AppError {
    return new AppError(message, 404, errorCode);
  }

  static conflict(message: string = 'Resource conflict', errorCode: string = 'CONFLICT'): AppError {
    return new AppError(message, 409, errorCode);
  }

  static validationFailed(
    message: string = 'Validation failed',
    errorCode: string = 'VALIDATION_ERROR',
  ): AppError {
    return new AppError(message, 422, errorCode);
  }

  static internal(
    message: string = 'Internal server error',
    errorCode: string = 'SERVER_ERROR',
  ): AppError {
    return new AppError(message, 500, errorCode, true);
  }
}
