import { PrismaClient, RefreshToken as PrismaRefreshToken } from '@prisma/client';
import { BasePrismaRepository } from './BasePrismaRepository';
import { RefreshToken, TokenCreationAttributes } from '../../../domain/auth/entities/RefreshToken';
import { IRefreshTokenRepository } from '../../../domain/auth/repositories/RefreshTokenRepository.interface';

/**
 * Refresh token repository implementation using Prisma
 */
export class RefreshTokenRepository
  extends BasePrismaRepository<RefreshToken, string>
  implements IRefreshTokenRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, 'refreshToken');
  }

  /**
   * Convert Prisma RefreshToken to Domain RefreshToken
   */
  private toDomainEntity(prismaToken: PrismaRefreshToken): RefreshToken {
    return prismaToken as RefreshToken;
  }

  /**
   * Find a refresh token by token string
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    return refreshToken ? this.toDomainEntity(refreshToken) : null;
  }

  /**
   * Create a new refresh token
   */
  async createToken(data: TokenCreationAttributes): Promise<RefreshToken> {
    const token = await this.prisma.refreshToken.create({
      data,
    });

    return this.toDomainEntity(token);
  }

  /**
   * Mark a token as revoked
   */
  async revokeToken(token: string): Promise<boolean> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return result.count > 0;
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<boolean> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return result.count > 0;
  }

  /**
   * Delete expired tokens
   */
  async deleteExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
      },
    });

    return result.count;
  }
}
