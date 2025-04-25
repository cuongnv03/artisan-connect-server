import { Logger } from '../../core/logging/Logger';
import { applyErrorHandlingToClass } from '../../shared/utils/ErrorHandling';
import { AppError } from '../../core/errors/AppError';

export abstract class BaseService {
  protected logger: Logger;

  constructor(
    errorHandlingConfig?: Array<{
      methodName: string;
      errorMessage: string;
      errorCode?: string;
    }>,
  ) {
    this.logger = Logger.getInstance();

    if (errorHandlingConfig) {
      applyErrorHandlingToClass(this, errorHandlingConfig, this.logger);
    }
  }

  /**
   * Xử lý lỗi chung cho các service
   */
  protected handleError(error: any, message: string, errorCode: string = 'SERVICE_ERROR'): never {
    this.logger.error(`${message}: ${error}`);

    if (error instanceof AppError) throw error;

    throw AppError.internal(message, errorCode, {
      cause: error as Error,
    });
  }

  /**
   * Validate entity tồn tại
   */
  protected validateExists<T>(entity: T | null, entityName: string, id: string): T {
    if (!entity) {
      throw AppError.notFound(
        `${entityName} with ID ${id} not found`,
        `${entityName.toUpperCase()}_NOT_FOUND`,
      );
    }
    return entity;
  }

  // Có thể thêm các phương thức utility chung khác cho services
}
