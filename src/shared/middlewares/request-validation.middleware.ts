import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../core/errors/AppError';

/**
 * Middleware to validate request ID parameters
 */
export const validateIdParam = (
  paramName: string = 'id',
  errorMessage: string = 'Invalid ID parameter',
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];

    if (!id) {
      return next(AppError.badRequest(`${paramName} parameter is required`));
    }

    // UUID validation - basic regex check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return next(AppError.badRequest(errorMessage, 'INVALID_ID_FORMAT'));
    }

    next();
  };
};

/**
 * Middleware to trim string values in request body
 */
export const trimRequestBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};
