import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppError } from '../../../shared/errors/AppError';
import { Logger } from '../../../shared/utils/Logger';

/**
 * Global error handler middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const logger = Logger.getInstance();

  // Log error details
  logger.error(
    `[${req.method}] ${req.path} >> StatusCode:: ${err instanceof AppError ? err.statusCode : 500}, Message:: ${err.message}`,
  );
  logger.error(err.stack || 'No stack trace available');

  // Handle AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.errorCode,
      message: err.message,
    });
  }

  // Handle Prisma Errors
  if (err instanceof PrismaClientKnownRequestError) {
    // Handle unique constraint errors
    if (err.code === 'P2002') {
      const target = err.meta?.target as string[];
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_ENTRY',
        message: `${target ? target.join(', ') : 'A record'} already exists.`,
      });
    }

    // Handle record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: err.message || 'Record not found',
      });
    }
  }

  // Handle validation errors (Joi)
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: err.message,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid authentication token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'TOKEN_EXPIRED',
      message: 'Authentication token expired',
    });
  }

  // Generic error response
  const statusCode = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message || 'An unexpected error occurred';

  return res.status(statusCode).json({
    success: false,
    error: 'SERVER_ERROR',
    message,
  });
};
