import { Logger } from '../../../core/logging/Logger';

interface TrackActivityDto {
  userId: string;
  activityType: string;
  entityId?: string;
  entityType?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityTrackingService {
  private logger = Logger.getInstance();

  async trackActivity(data: TrackActivityDto): Promise<void> {
    this.logger.info(
      `Activity: user=${data.userId} type=${data.activityType} entity=${data.entityType}/${data.entityId ?? 'n/a'}`,
    );
  }
}
