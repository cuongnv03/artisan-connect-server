import { AppError } from '../../core/errors/AppError';

export class Validators {
  /**
   * Validate rằng một entity tồn tại
   */
  static async validateExists<T>(entity: T | null, entityName: string, id: string): Promise<T> {
    if (!entity) {
      throw AppError.notFound(
        `${entityName} with ID ${id} not found`,
        `${entityName.toUpperCase()}_NOT_FOUND`,
      );
    }
    return entity;
  }

  /**
   * Validate rằng người dùng có quyền chỉnh sửa
   */
  static validateOwnership(ownerId: string, currentUserId: string, entityName: string): void {
    if (ownerId !== currentUserId) {
      throw AppError.forbidden(`You can only modify your own ${entityName}`, 'FORBIDDEN_ACTION');
    }
  }

  /**
   * Validate rằng giá trị không trống
   */
  static validateNotEmpty(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw AppError.validationFailed(`${fieldName} cannot be empty`, 'VALIDATION_ERROR');
    }
  }

  /**
   * Validate rằng số là dương
   */
  static validatePositiveNumber(value: number, fieldName: string): void {
    if (value <= 0) {
      throw AppError.validationFailed(`${fieldName} must be a positive number`, 'VALIDATION_ERROR');
    }
  }

  /**
   * Validate rằng array không trống
   */
  static validateNonEmptyArray(array: any[] | undefined | null, fieldName: string): void {
    if (!array || array.length === 0) {
      throw AppError.validationFailed(`${fieldName} cannot be empty`, 'VALIDATION_ERROR');
    }
  }
}
