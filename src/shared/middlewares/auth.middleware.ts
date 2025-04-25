import { JwtService } from '../../core/infrastructure/security/JwtService';
import { Request, Response, NextFunction } from 'express';
import { PrismaClientManager } from '../../core/database/PrismaClient';
import { AppError } from '../../core/errors/AppError';
import container from '../../core/di/container';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Access token is required');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const jwtService = container.resolve<JwtService>('jwtService');
    const decoded = jwtService.verifyAccessToken(token);

    if (!decoded) {
      throw AppError.unauthorized('Invalid or expired token');
    }

    // Get prisma client
    const prisma = PrismaClientManager.getClient();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw AppError.unauthorized('User not found');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required');
      }

      if (roles.length > 0 && !roles.includes(req.user.role)) {
        throw AppError.forbidden('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
