import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { UserActivity, CreateUserActivityDto } from '../models/UserActivity';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IUserActivityRepository extends BaseRepository<UserActivity, string> {
  createActivity(data: CreateUserActivityDto): Promise<UserActivity>;
  getUserActivities(
    userId: string,
    activityTypes?: string[],
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<UserActivity>>;
  getActivityStats(userId: string, days?: number): Promise<Record<string, number>>;
  deleteOldActivities(days: number): Promise<number>;
}
