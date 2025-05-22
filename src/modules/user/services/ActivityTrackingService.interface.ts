import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { CreateUserActivityDto, UserActivity } from '../models/UserActivity';

export interface IActivityTrackingService {
  trackActivity(data: CreateUserActivityDto): Promise<UserActivity>;
  getUserActivities(
    userId: string,
    activityTypes?: string[],
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<UserActivity>>;
  getActivityStats(userId: string, days?: number): Promise<Record<string, number>>;
}
