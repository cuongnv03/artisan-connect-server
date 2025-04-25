import { PaginatedResult } from '../interfaces/PaginatedResult';

export class PaginationUtils {
  /**
   * Calculate pagination metadata
   */
  static calculatePaginationMetadata(
    total: number,
    page: number,
    limit: number,
  ): {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Create paginated result
   */
  static createPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    return {
      data,
      meta: this.calculatePaginationMetadata(total, page, limit),
    };
  }

  /**
   * Calculate skip value for database queries
   */
  static calculateSkip(page: number, limit: number): number {
    return (Math.max(1, page) - 1) * limit;
  }

  /**
   * Normalize pagination parameters
   */
  static normalizePaginationParams(page?: number, limit?: number): { page: number; limit: number } {
    return {
      page: Math.max(1, page || 1),
      limit: Math.min(100, Math.max(1, limit || 10)),
    };
  }
}
