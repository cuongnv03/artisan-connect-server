import { PrismaClient, RefreshToken as PrismaRefreshToken } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { RefreshToken, TokenCreationAttributes } from '../models/RefreshToken';
import { IRefreshTokenRepository } from './RefreshTokenRepository.interface';

export class RefreshTokenRepository
  extends BasePrismaRepository<RefreshToken, string>
  implements IRefreshTokenRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, 'refreshToken');
  }

  private toDomainEntity(prismaToken: PrismaRefreshToken): RefreshToken {
    return prismaToken as RefreshToken;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    return refreshToken ? this.toDomainEntity(refreshToken) : null;
  }

  async createToken(data: TokenCreationAttributes): Promise<RefreshToken> {
    const token = await this.prisma.refreshToken.create({
      data,
    });
    return this.toDomainEntity(token);
  }

  async revokeToken(token: string): Promise<boolean> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count > 0;
  }

  async revokeAllUserTokens(userId: string): Promise<boolean> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count > 0;
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
      },
    });
    return result.count;
  }
}
