import { RefreshToken, TokenCreationAttributes } from '../models/RefreshToken';
import { BaseRepository } from '../../../shared/interfaces/BaseRepository';

/**
 * Refresh token repository interface
 */
export interface IRefreshTokenRepository extends BaseRepository<RefreshToken, string> {
  /**
   * Find a refresh token by token string
   */
  findByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Create a new refresh token
   */
  createToken(data: TokenCreationAttributes): Promise<RefreshToken>;

  /**
   * Mark a token as revoked
   */
  revokeToken(token: string): Promise<boolean>;

  /**
   * Revoke all tokens for a user
   */
  revokeAllUserTokens(userId: string): Promise<boolean>;

  /**
   * Delete expired tokens
   */
  deleteExpiredTokens(): Promise<number>;
}
