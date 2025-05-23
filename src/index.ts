import { Config } from './config/config';
import { Logger } from './core/logging/Logger';
import { PrismaClientManager } from './core/database/PrismaClient';

// Initialize configuration and logging
const logger = Logger.getInstance();
const { port, env } = Config.getServerConfig();

async function bootstrap() {
  try {
    // Validate configuration
    Config.validate();
    logger.info('Configuration validated successfully');

    // Initialize dependency injection
    await import('./core/di/injection');
    logger.info('Dependency injection initialized');

    // Test database connection
    const prisma = PrismaClientManager.getClient();
    await prisma.$connect();
    logger.info('Database connection established');

    // Initialize application
    const appInstance = (await import('./app')).default;

    // Setup routes
    appInstance.setupRoutes();

    // Start server (using server instead of app for Socket.io support)
    const server = appInstance.server.listen(Number(port), '0.0.0.0', () => {
      logger.info(`🚀 Server running in ${env} mode on port ${port}`);
      logger.info(`📚 API Documentation: http://localhost:${port}${Config.API_PREFIX}`);
      logger.info(`🏥 Health Check: http://localhost:${port}/health`);
      logger.info(`🔌 Socket.IO ready for connections`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await appInstance.shutdown();
          process.exit(0);
        } catch (error) {
          logger.error(`Error during shutdown: ${error}`);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error(`Uncaught Exception: ${error}`);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(`Unhandled Promise Rejection: ${reason}`);
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error(`Failed to start application: ${error}`);
    process.exit(1);
  }
}

// Start the application
bootstrap();
