import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { errorHandler } from './interfaces/http/middlewares/errorHandler.middleware';
import { Config } from './config/config';
import { Logger } from './shared/utils/Logger';
// Không import registerRoutes ở đây nữa

export class App {
  public app: Express;
  private logger = Logger.getInstance();

  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupErrorHandling();
  }

  /**
   * Set up global middlewares
   */
  private setupMiddlewares(): void {
    // Security middlewares
    this.app.use(helmet());
    this.app.use(cors(Config.getCorsConfig()));

    // Parse request body
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Parse cookies
    this.app.use(cookieParser(Config.getCookieConfig().secret));

    // Compress responses
    this.app.use(compression());

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`[${req.method}] ${req.url}`);
      next();
    });
  }

  /**
   * Method to register routes after DI is set up
   */
  public setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Import here to make sure DI is already initialized
    const { registerRoutes } = require('./interfaces/http/routes');
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
}

export default new App().app;
