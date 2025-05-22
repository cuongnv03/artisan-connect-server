import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { PasswordReset, CreatePasswordResetTokenDto } from '../models/PasswordReset';

export interface IPasswordResetRepository extends BaseRepository<PasswordReset, string> {
  createToken(data: CreatePasswordResetTokenDto): Promise<PasswordReset>;
  findByToken(token: string): Promise<PasswordReset | null>;
  deleteUserTokens(userId: string): Promise<number>;
  deleteExpiredTokens(): Promise<number>;
}
