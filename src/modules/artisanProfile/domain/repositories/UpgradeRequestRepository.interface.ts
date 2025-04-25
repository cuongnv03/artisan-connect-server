import { BaseRepository } from '../../../../shared/interfaces/BaseRepository';
import {
  ArtisanUpgradeRequest,
  ArtisanUpgradeRequestWithUser,
} from '../entities/ArtisanUpgradeRequest';
import { ArtisanUpgradeRequestDto } from '../entities/ArtisanProfile';
import { PaginatedResult } from '../../../../shared/interfaces/PaginatedResult';

export interface IUpgradeRequestRepository extends BaseRepository<ArtisanUpgradeRequest, string> {
  /**
   * Find request by user ID
   */
  findByUserId(userId: string): Promise<ArtisanUpgradeRequest | null>;

  /**
   * Create upgrade request
   */
  createUpgradeRequest(
    userId: string,
    data: ArtisanUpgradeRequestDto,
  ): Promise<ArtisanUpgradeRequest>;

  /**
   * Update upgrade request
   */
  updateUpgradeRequest(
    id: string,
    data: Partial<ArtisanUpgradeRequest>,
  ): Promise<ArtisanUpgradeRequest>;

  /**
   * Get paginated upgrade requests with user details
   */
  getUpgradeRequests(
    status?: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<ArtisanUpgradeRequestWithUser>>;

  /**
   * Approve upgrade request and create profile
   */
  approveRequest(id: string, adminNotes?: string): Promise<ArtisanUpgradeRequest>;

  /**
   * Reject upgrade request
   */
  rejectRequest(id: string, adminNotes: string): Promise<ArtisanUpgradeRequest>;
}
