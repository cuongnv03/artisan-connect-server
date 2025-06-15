import { IPriceNegotiationService } from './PriceNegotiationService.interface';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';
import cron from 'node-cron';

export class NegotiationTaskService {
  private negotiationService: IPriceNegotiationService;
  private logger = Logger.getInstance();

  constructor() {
    this.negotiationService =
      container.resolve<IPriceNegotiationService>('priceNegotiationService');
  }

  /**
   * Background task to expire old price negotiations
   * Should be run periodically (e.g., every hour)
   */
  async expireOldNegotiations(): Promise<void> {
    try {
      this.logger.info('Starting price negotiation expiration task...');

      const expiredCount = await this.negotiationService.expireOldNegotiations();

      if (expiredCount > 0) {
        this.logger.info(
          `Price negotiation expiration task completed: ${expiredCount} negotiations expired`,
        );
      } else {
        this.logger.debug('Price negotiation expiration task completed: no negotiations to expire');
      }
    } catch (error) {
      this.logger.error(`Price negotiation expiration task failed: ${error}`);
    }
  }

  /**
   * Setup recurring task (if using cron or scheduler)
   */
  setupRecurringTasks(): void {
    cron.schedule('0 * * * *', () => {
      // Every hour
      this.expireOldNegotiations();
    });

    this.logger.info('Price negotiation background tasks configured');
  }
}
