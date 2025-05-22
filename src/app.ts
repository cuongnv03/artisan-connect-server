import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './shared/middlewares/errorHandler.middleware';
import { Config } from './config/config';
import { Logger } from './core/logging/Logger';

export class App {
  public app: Express;
  private logger = Logger.getInstance();

  constructor() {
    // Validate configuration first
    Config.validate();

    this.app = express();
    this.setupMiddlewares();
    this.setupErrorHandling();
  }

  /**
   * Set up global middlewares
   */
  private setupMiddlewares(): void {
    // Security middlewares
    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
      }),
    );

    this.app.use(cors(Config.getCorsConfig()));

    // Rate limiting
    if (Config.isProduction()) {
      const limiter = rateLimit({
        windowMs: Config.getRateLimitConfig().windowMs,
        max: Config.getRateLimitConfig().max,
        message: {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.',
        },
        standardHeaders: true,
        legacyHeaders: false,
      });
      this.app.use(limiter);
    }

    // Parse request body
    this.app.use(
      express.json({
        limit: '10mb',
        verify: (req: any, res, buf) => {
          req.rawBody = buf;
        },
      }),
    );
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Parse cookies
    this.app.use(cookieParser(Config.getCookieConfig().secret));

    // Compress responses
    this.app.use(compression());

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

        this.logger[logLevel](
          `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms ${req.ip || 'unknown'}`,
        );
      });

      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: Config.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
      });
    });
  }

  /**
   * Method to register routes after DI is set up
   */
  public setupRoutes(): void {
    // Import routes after DI container is initialized
    const { registerRoutes } = require('./routes');
    registerRoutes(this.app);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        error: 'NOT_FOUND',
      });
    });
  }

  /**
   * Set up error handling
   */
  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * Graceful shutdown handler
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down application...');

    try {
      // Close database connections
      const { PrismaClientManager } = await import('./core/database/PrismaClient');
      await PrismaClientManager.disconnect();
      this.logger.info('Database connections closed');
    } catch (error) {
      this.logger.error(`Error closing database connections: ${error}`);
    }
  }
}

export default new App();
