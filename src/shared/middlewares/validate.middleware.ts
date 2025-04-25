import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { AppError } from '../../core/errors/AppError';

/**
 * Middleware for validating request data with Joi
 */
export const validate = (schema: Schema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const message = error.details.map((detail) => detail.message).join(', ');

        throw AppError.validationFailed(message);
      }

      // Replace validated object for further processing
      req[property] = value;

      next();
    } catch (error) {
      next(error);
    }
  };
};
