import app from './app';
import { Config } from './config/config';
import { Logger } from './shared/utils/Logger';
import { PrismaClientManager } from './infrastructure/database/prisma/PrismaClient';
import './di/injection'; // Load dependency injection

const logger = Logger.getInstance();
const { port, env } = Config.getServerConfig();

// Start the server
const server = app.listen(Number(port), '0.0.0.0', () => {
  logger.info(`Server running in ${env} mode on port ${port}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:');
  logger.error(error.stack || error.message);
  // Graceful shutdown
  shutdown(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:');
  logger.error(`Promise: ${promise}`);
  logger.error(`Reason: ${reason}`);
});

// Graceful shutdown
const shutdown = async (code: number) => {
  logger.info('Shutting down server...');

  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Disconnect from database
  try {
    await PrismaClientManager.disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error during database disconnection');
  }

  // Exit process
  setTimeout(() => {
    logger.info('Process terminated');
    process.exit(code);
  }, 1000);
};

// Handle graceful shutdown signals
process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
