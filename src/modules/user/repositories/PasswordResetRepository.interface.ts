import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { PasswordReset, CreatePasswordResetTokenDto } from '../models/PasswordReset';

export interface IPasswordResetRepository extends BaseRepository<PasswordReset, string> {
  /**
   * Create a new password reset token
   */
  createToken(data: CreatePasswordResetTokenDto): Promise<PasswordReset>;

  /**
   * Find token by token string
   */
  findByToken(token: string): Promise<PasswordReset | null>;

  /**
   * Delete all tokens for a user
   */
  deleteUserTokens(userId: string): Promise<number>;

  /**
   * Delete expired tokens
   */
  deleteExpiredTokens(): Promise<number>;
}
