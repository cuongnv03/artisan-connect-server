import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import {
  ArtisanUpgradeRequest,
  ArtisanUpgradeRequestWithUser,
  CreateUpgradeRequestDto,
  ReviewUpgradeRequestDto,
} from '../models/ArtisanUpgradeRequest';
import { UpgradeRequestStatus } from '../models/ArtisanEnums';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IUpgradeRequestRepository extends BaseRepository<ArtisanUpgradeRequest, string> {
  findByUserId(userId: string): Promise<ArtisanUpgradeRequest | null>;
  findByIdWithUser(id: string): Promise<ArtisanUpgradeRequestWithUser | null>;
  createRequest(userId: string, data: CreateUpgradeRequestDto): Promise<ArtisanUpgradeRequest>;
  updateRequest(id: string, data: Partial<ArtisanUpgradeRequest>): Promise<ArtisanUpgradeRequest>;
  getRequests(
    status?: UpgradeRequestStatus,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<ArtisanUpgradeRequestWithUser>>;
  reviewRequest(id: string, reviewData: ReviewUpgradeRequestDto): Promise<ArtisanUpgradeRequest>;
  approveRequest(id: string, adminId: string, adminNotes?: string): Promise<ArtisanUpgradeRequest>;
  rejectRequest(id: string, adminId: string, adminNotes: string): Promise<ArtisanUpgradeRequest>;
}
