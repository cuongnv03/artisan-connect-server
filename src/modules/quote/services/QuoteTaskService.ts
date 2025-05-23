import { IQuoteService } from './QuoteService.interface';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';
import cron from 'node-cron';

export class QuoteTaskService {
  private quoteService: IQuoteService;
  private logger = Logger.getInstance();

  constructor() {
    this.quoteService = container.resolve<IQuoteService>('quoteService');
  }

  /**
   * Background task to expire old quotes
   * Should be run periodically (e.g., every hour)
   */
  async expireOldQuotes(): Promise<void> {
    try {
      this.logger.info('Starting quote expiration task...');

      const expiredCount = await this.quoteService.expireOldQuotes();

      if (expiredCount > 0) {
        this.logger.info(`Quote expiration task completed: ${expiredCount} quotes expired`);
      } else {
        this.logger.debug('Quote expiration task completed: no quotes to expire');
      }
    } catch (error) {
      this.logger.error(`Quote expiration task failed: ${error}`);
    }
  }

  /**
   * Setup recurring task (if using cron or scheduler)
   */
  setupRecurringTasks(): void {
    cron.schedule('0 * * * *', () => {
      // Every hour
      this.expireOldQuotes();
    });

    this.logger.info('Quote background tasks configured');
  }
}
