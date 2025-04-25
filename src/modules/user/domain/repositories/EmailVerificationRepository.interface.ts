import { BaseRepository } from '../../../../shared/interfaces/BaseRepository';
import { EmailVerification, CreateEmailVerificationTokenDto } from '../entities/EmailVerification';

export interface IEmailVerificationRepository extends BaseRepository<EmailVerification, string> {
  /**
   * Create a new email verification token
   */
  createToken(data: CreateEmailVerificationTokenDto): Promise<EmailVerification>;

  /**
   * Find token by token string
   */
  findByToken(token: string): Promise<EmailVerification | null>;

  /**
   * Delete token by token string
   */
  deleteToken(token: string): Promise<boolean>;

  /**
   * Delete all tokens for a user
   */
  deleteUserTokens(userId: string): Promise<number>;

  /**
   * Delete expired tokens
   */
  deleteExpiredTokens(): Promise<number>;
}
