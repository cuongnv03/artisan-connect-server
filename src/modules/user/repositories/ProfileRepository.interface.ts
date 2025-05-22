import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { Profile, ProfileWithUser, UpdateProfileDto } from '../models/Profile';

export interface IProfileRepository extends BaseRepository<Profile, string> {
  findByUserId(userId: string): Promise<ProfileWithUser | null>;
  ensureProfile(userId: string): Promise<Profile>;
  updateProfile(userId: string, data: UpdateProfileDto): Promise<ProfileWithUser>;
}
