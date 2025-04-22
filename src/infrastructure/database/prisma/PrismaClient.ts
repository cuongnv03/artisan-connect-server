import { PrismaClient } from '@prisma/client';
import { Logger } from '../../../shared/utils/Logger';

/**
 * Prisma client singleton with logging
 */
export class PrismaClientManager {
  private static instance: PrismaClient;
  private static logger = Logger.getInstance();

  /**
   * Get Prisma client instance
   */
  public static getClient(): PrismaClient {
    if (!PrismaClientManager.instance) {
      PrismaClientManager.instance = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ],
      });

      // Log queries in development
      if (process.env.NODE_ENV !== 'production') {
        (PrismaClientManager.instance as any).$on('query', (e: any) => {
          this.logger.debug(`Query: ${e.query}`);
          this.logger.debug(`Params: ${e.params}`);
          this.logger.debug(`Duration: ${e.duration}ms`);
        });
      }

      // Log errors
      (PrismaClientManager.instance as any).$on('error', (e: any) => {
        this.logger.error(`Prisma Error: ${e.message}`);
      });
    }

    return PrismaClientManager.instance;
  }

  /**
   * Disconnect Prisma client
   */
  public static async disconnect(): Promise<void> {
    if (PrismaClientManager.instance) {
      await PrismaClientManager.instance.$disconnect();
    }
  }
}
