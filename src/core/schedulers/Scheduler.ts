import { CronJob } from 'cron';
import { Logger } from '../logging/Logger';
import { NotificationCleanupJob } from './NotificationCleanupJob';

export class Scheduler {
  private static instance: Scheduler;
  private logger = Logger.getInstance();
  private jobs: CronJob[] = [];

  private constructor() {
    this.setupJobs();
  }

  public static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  /**
   * Setup all scheduled jobs
   */
  private setupJobs(): void {
    // Notification cleanup job - run every day at 3 AM
    const notificationCleanupJob = new CronJob(
      '0 3 * * *',
      () => {
        const job = new NotificationCleanupJob();
        job.execute().catch((err) => {
          this.logger.error(`Failed to execute notification cleanup job: ${err}`);
        });
      },
      null,
      false,
      'UTC',
    );

    this.jobs.push(notificationCleanupJob);
  }

  /**
   * Start all scheduled jobs
   */
  public start(): void {
    this.logger.info('Starting scheduler...');

    this.jobs.forEach((job) => {
      job.start();
    });

    this.logger.info(`Started ${this.jobs.length} scheduled jobs`);
  }

  /**
   * Stop all scheduled jobs
   */
  public stop(): void {
    this.logger.info('Stopping scheduler...');

    this.jobs.forEach((job) => {
      job.stop();
    });

    this.logger.info('All scheduled jobs stopped');
  }
}
