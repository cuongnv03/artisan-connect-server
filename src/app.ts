import express, { Express } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './shared/middlewares/errorHandler.middleware';
import { Config } from './config/config';
import { Logger } from './core/logging/Logger';
import { SocketService } from './core/infrastructure/socket/SocketService';

export class App {
  public app: Express;
  public server: any;
  public io!: SocketIOServer; // Definite assignment assertion
  public socketService!: SocketService; // Definite assignment assertion
  private logger = Logger.getInstance();

  constructor() {
    // Validate configuration first
    Config.validate();

    this.app = express();
    this.server = createServer(this.app);
    this.setupSocketIO();
    this.registerSocketService();
    this.setupMiddlewares();
    this.setupErrorHandling();
  }

  /**
   * Setup Socket.IO server
   */
  private setupSocketIO(): void {
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: Config.getCorsConfig().origin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Initialize Socket Service
    this.socketService = new SocketService(this.io);

    this.logger.info('Socket.IO server initialized');
  }

  /**
   * Register socket service in DI container
   */
  private registerSocketService(): void {
    const { registerSocketService } = require('./core/di/injection');
    registerSocketService(this.socketService);
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
        socketConnections: this.io.engine.clientsCount,
      });
    });

    // Socket.io status endpoint
    this.app.get('/socket-status', (req, res) => {
      res.status(200).json({
        connected: this.io.engine.clientsCount,
        rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
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
   * Get Socket.IO instance
   */
  public getSocketIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Get Socket Service
   */
  public getSocketService(): SocketService {
    return this.socketService;
  }

  /**
   * Graceful shutdown handler
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down application...');

    try {
      // Close Socket.IO connections
      this.io.close();
      this.logger.info('Socket.IO server closed');

      // Close HTTP server
      if (this.server) {
        this.server.close();
        this.logger.info('HTTP server closed');
      }

      // Close database connections
      const { PrismaClientManager } = await import('./core/database/PrismaClient');
      await PrismaClientManager.disconnect();
      this.logger.info('Database connections closed');
    } catch (error) {
      this.logger.error(`Error closing connections: ${error}`);
    }
  }
}

export default new App();
