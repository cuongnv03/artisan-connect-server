import { Logger } from '../../core/logging/Logger';
import { AppError } from '../../core/errors/AppError';

// Type cho function ban đầu
export type AsyncFunction<T, Args extends any[]> = (...args: Args) => Promise<T>;

/**
 * Higher Order Function để xử lý lỗi thống nhất
 */
export function withErrorHandling<T, Args extends any[]>(
  fn: AsyncFunction<T, Args>,
  errorMessage: string,
  errorCode: string = 'SERVICE_ERROR',
  logger: Logger = Logger.getInstance(),
): AsyncFunction<T, Args> {
  return async function (...args: Args): Promise<T> {
    try {
      return await fn(...args);
    } catch (error) {
      // Log lỗi với context
      const formattedArgs = args
        .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
        .join(', ');
      logger.error(`${errorMessage} [Args: ${formattedArgs}]: ${error}`);

      if (error instanceof AppError) throw error;

      // Tạo AppError mới với ngữ cảnh lỗi gốc
      throw AppError.internal(errorMessage, errorCode, {
        cause: error as Error,
        metadata: { args: args.length > 0 ? args : undefined },
      });
    }
  };
}

/**
 * Utility để áp dụng error handling cho toàn bộ class
 */
export function applyErrorHandlingToClass(
  instance: any,
  methodsConfig: Array<{
    methodName: string;
    errorMessage: string;
    errorCode?: string;
  }>,
  logger: Logger = Logger.getInstance(),
): void {
  for (const { methodName, errorMessage, errorCode } of methodsConfig) {
    const originalMethod = instance[methodName];
    if (typeof originalMethod === 'function') {
      instance[methodName] = withErrorHandling(
        originalMethod.bind(instance),
        errorMessage,
        errorCode,
        logger,
      );
    }
  }
}
