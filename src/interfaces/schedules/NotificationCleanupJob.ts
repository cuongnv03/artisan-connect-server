import { Logger } from '../../shared/utils/Logger';
import { INotificationService } from '../../application/services/notification/NotificationService.interface';
import container from '../../di/container';

export class NotificationCleanupJob {
  private logger = Logger.getInstance();
  private notificationService: INotificationService;
  private readonly DAYS_TO_KEEP = 30; // Keep notifications for 30 days by default

  constructor() {
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  /**
   * Run the cleanup job
   */
  async execute(): Promise<void> {
    try {
      this.logger.info(`Starting notification cleanup job`);

      const count = await this.notificationService.cleanupOldNotifications(this.DAYS_TO_KEEP);

      this.logger.info(`Notification cleanup job completed: ${count} notifications deleted`);
    } catch (error) {
      this.logger.error(`Error in notification cleanup job: ${error}`);
    }
  }
}
