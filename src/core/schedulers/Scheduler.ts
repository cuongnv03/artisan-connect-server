import { CronJob } from 'cron';
import { Logger } from '../logging/Logger';

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
    this.logger.info('No scheduled jobs configured');
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
