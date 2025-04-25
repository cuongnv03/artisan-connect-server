export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly cause?: Error;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'SERVER_ERROR',
    options: {
      isOperational?: boolean;
      cause?: Error;
      metadata?: Record<string, any>;
    } = {},
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = options.isOperational ?? true;
    this.cause = options.cause;
    this.metadata = options.metadata;

    // Nếu có cause, kết hợp stack trace
    if (this.cause instanceof Error && this.cause.stack) {
      this.stack = this.stack + '\nCaused by: ' + this.cause.stack;
    } else {
      // Để stack trace bắt đầu tại vị trí tạo Error
      Error.captureStackTrace(this, this.constructor);
    }

    // Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Get full error context including cause chain
   */
  getErrorContext(): Record<string, any> {
    const context: Record<string, any> = {
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      isOperational: this.isOperational,
    };

    if (this.metadata) {
      context.metadata = this.metadata;
    }

    if (this.cause) {
      context.cause =
        this.cause instanceof AppError
          ? this.cause.getErrorContext()
          : {
              message: this.cause.message,
              name: this.cause.name,
              stack: this.cause.stack,
            };
    }

    return context;
  }

  // Cập nhật các factory methods để hỗ trợ options mới
  static badRequest(
    message: string = 'Bad request',
    errorCode: string = 'BAD_REQUEST',
    options?: { cause?: Error; metadata?: Record<string, any> },
  ): AppError {
    return new AppError(message, 400, errorCode, {
      isOperational: true,
      ...options,
    });
  }

  static unauthorized(
    message: string = 'Unauthorized',
    errorCode: string = 'UNAUTHORIZED',
    options?: { cause?: Error; metadata?: Record<string, any> },
  ): AppError {
    return new AppError(message, 401, errorCode, {
      isOperational: true,
      ...options,
    });
  }

  static forbidden(
    message: string = 'Forbidden',
    errorCode: string = 'FORBIDDEN',
    options?: { cause?: Error; metadata?: Record<string, any> },
  ): AppError {
    return new AppError(message, 403, errorCode, {
      isOperational: true,
      ...options,
    });
  }

  static notFound(
    message: string = 'Resource not found',
    errorCode: string = 'NOT_FOUND',
    options?: { cause?: Error; metadata?: Record<string, any> },
  ): AppError {
    return new AppError(message, 404, errorCode, {
      isOperational: true,
      ...options,
    });
  }

  static conflict(
    message: string = 'Resource conflict',
    errorCode: string = 'CONFLICT',
    options?: { cause?: Error; metadata?: Record<string, any> },
  ): AppError {
    return new AppError(message, 409, errorCode, {
      isOperational: true,
      ...options,
    });
  }

  static validationFailed(
    message: string = 'Validation failed',
    errorCode: string = 'VALIDATION_ERROR',
    options?: { cause?: Error; metadata?: Record<string, any> },
  ): AppError {
    return new AppError(message, 422, errorCode, {
      isOperational: true,
      ...options,
    });
  }

  static internal(
    message: string = 'Internal server error',
    errorCode: string = 'SERVER_ERROR',
    options?: { cause?: Error; metadata?: Record<string, any>; isOperational?: boolean },
  ): AppError {
    return new AppError(message, 500, errorCode, {
      isOperational: options?.isOperational ?? true,
      cause: options?.cause,
      metadata: options?.metadata,
    });
  }
}
