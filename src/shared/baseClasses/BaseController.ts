import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../core/errors/AppError';

/**
 * Base Controller Abstract Class
 *
 * Provides common functionality for all controllers
 */
export abstract class BaseController {
  /**
   * Execute controller implementation
   * This method should be overridden by concrete controllers
   */
  protected abstract executeImpl(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | any>;

  /**
   * Execute controller with error handling
   */
  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.executeImpl(req, res, next);
    } catch (error) {
      if (error instanceof AppError) {
        // Add request information to metadata for better diagnostics
        error.metadata = {
          ...error.metadata,
          requestInfo: {
            path: req.path,
            method: req.method,
            params: req.params,
            query: req.query,
            // Don't include body for security - could contain sensitive info
            // Or sanitize it before including
          },
        };
      }
      next(error);
    }
  };

  /**
   * Validate that request is authenticated
   */
  protected validateAuth(req: Request): void {
    if (!req.user) {
      throw AppError.unauthorized();
    }
  }

  /**
   * Validate user has required role
   */
  protected validateRole(req: Request, roles: string[]): void {
    this.validateAuth(req);

    if (!roles.includes(req.user!.role)) {
      throw AppError.forbidden('Insufficient permissions');
    }
  }

  /**
   * Create handler method to wrap controller methods
   */
  protected createHandler(
    method: Function,
  ): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await method.call(this, req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }
}
