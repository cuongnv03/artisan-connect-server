import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppError } from '../../core/errors/AppError';
import { Logger } from '../../core/logging/Logger';

/**
 * Global error handler middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const logger = Logger.getInstance();
  const isDev = process.env.NODE_ENV !== 'production';

  // Log error details with full context if available
  if (err instanceof AppError) {
    logger.error(
      `[${req.method}] ${req.path} >> StatusCode:: ${err.statusCode}, ErrorCode:: ${err.errorCode}, Message:: ${err.message}`,
    );

    // Log full error context in development
    if (isDev) {
      logger.error('Full error context:');
      logger.error(JSON.stringify(err.getErrorContext(), null, 2));
    } else {
      logger.error(err.stack || 'No stack trace available');
    }
  } else {
    logger.error(`[${req.method}] ${req.path} >> StatusCode:: 500, Message:: ${err.message}`);
    logger.error(err.stack || 'No stack trace available');
  }

  // Handle AppError
  if (err instanceof AppError) {
    const response: Record<string, any> = {
      success: false,
      error: err.errorCode,
      message: err.message,
    };

    // Include cause and metadata in development
    if (isDev) {
      if (err.cause) {
        response.cause =
          err.cause instanceof AppError
            ? err.cause.getErrorContext()
            : {
                message: err.cause.message,
                name: err.cause.name,
              };
      }

      if (err.metadata) {
        response.metadata = err.metadata;
      }
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle Prisma Errors - add context to error
  if (err instanceof PrismaClientKnownRequestError) {
    // Handle unique constraint errors
    if (err.code === 'P2002') {
      const target = err.meta?.target as string[];
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_ENTRY',
        message: `${target ? target.join(', ') : 'A record'} already exists.`,
        ...(isDev ? { prismaError: { code: err.code, meta: err.meta } } : {}),
      });
    }

    // Handle record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: err.message || 'Record not found',
        ...(isDev ? { prismaError: { code: err.code, meta: err.meta } } : {}),
      });
    }

    // Handle other Prisma errors
    return res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: isDev ? `Database error: ${err.message}` : 'A database error occurred',
      ...(isDev ? { prismaError: { code: err.code, meta: err.meta } } : {}),
    });
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
  const message = isDev
    ? err.message || 'An unexpected error occurred'
    : 'An unexpected error occurred';

  return res.status(statusCode).json({
    success: false,
    error: 'SERVER_ERROR',
    message,
    ...(isDev ? { stack: err.stack } : {}),
  });
};
