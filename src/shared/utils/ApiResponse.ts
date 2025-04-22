import { Response } from 'express';

/**
 * Standardized API response handler
 *
 * Đảm bảo format phản hồi API nhất quán trong toàn ứng dụng
 */
export class ApiResponse {
  /**
   * Success response
   */
  static success(
    res: Response,
    data: any = null,
    message: string = 'Success',
    statusCode: number = 200,
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Created response (201)
   */
  static created(
    res: Response,
    data: any = null,
    message: string = 'Resource created successfully',
  ): Response {
    return this.success(res, data, message, 201);
  }

  /**
   * No content response (204)
   */
  static noContent(res: Response): Response {
    return res.status(204).end();
  }

  /**
   * Error response
   */
  static error(
    res: Response,
    message: string = 'An error occurred',
    errorCode: string = 'SERVER_ERROR',
    statusCode: number = 500,
  ): Response {
    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message,
    });
  }

  /**
   * Bad request response (400)
   */
  static badRequest(
    res: Response,
    message: string = 'Bad request',
    errorCode: string = 'BAD_REQUEST',
  ): Response {
    return this.error(res, message, errorCode, 400);
  }

  /**
   * Unauthorized response (401)
   */
  static unauthorized(
    res: Response,
    message: string = 'Unauthorized',
    errorCode: string = 'UNAUTHORIZED',
  ): Response {
    return this.error(res, message, errorCode, 401);
  }

  /**
   * Forbidden response (403)
   */
  static forbidden(
    res: Response,
    message: string = 'Forbidden',
    errorCode: string = 'FORBIDDEN',
  ): Response {
    return this.error(res, message, errorCode, 403);
  }

  /**
   * Not found response (404)
   */
  static notFound(
    res: Response,
    message: string = 'Resource not found',
    errorCode: string = 'NOT_FOUND',
  ): Response {
    return this.error(res, message, errorCode, 404);
  }

  /**
   * Validation error response (422)
   */
  static validationError(
    res: Response,
    message: string = 'Validation failed',
    errorCode: string = 'VALIDATION_ERROR',
  ): Response {
    return this.error(res, message, errorCode, 422);
  }
}
