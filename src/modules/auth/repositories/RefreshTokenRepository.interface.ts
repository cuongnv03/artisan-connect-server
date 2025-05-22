import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { RefreshToken, TokenCreationAttributes } from '../models/RefreshToken';

export interface IRefreshTokenRepository extends BaseRepository<RefreshToken, string> {
  findByToken(token: string): Promise<RefreshToken | null>;
  createToken(data: TokenCreationAttributes): Promise<RefreshToken>;
  revokeToken(token: string): Promise<boolean>;
  revokeAllUserTokens(userId: string): Promise<boolean>;
  deleteExpiredTokens(): Promise<number>;
}
