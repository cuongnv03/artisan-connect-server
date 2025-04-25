import { PrismaClient, PasswordReset as PrismaPasswordReset } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IPasswordResetRepository } from '../domain/repositories/PasswordResetRepository.interface';
import { PasswordReset, CreatePasswordResetTokenDto } from '../domain/entities/PasswordReset';

/**
 * Password reset repository implementation
 */
export class PasswordResetRepository
  extends BasePrismaRepository<PasswordReset, string>
  implements IPasswordResetRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, 'passwordReset');
  }

  /**
   * Convert Prisma entity to domain entity
   */
  private toDomainEntity(prismaEntity: PrismaPasswordReset): PasswordReset {
    return prismaEntity as PasswordReset;
  }

  /**
   * Create a new password reset token
   */
  async createToken(data: CreatePasswordResetTokenDto): Promise<PasswordReset> {
    // Delete existing tokens for user first
    await this.prisma.passwordReset.deleteMany({
      where: { userId: data.userId },
    });

    // Create new token
    const token = await this.prisma.passwordReset.create({
      data,
    });

    return this.toDomainEntity(token);
  }

  /**
   * Find token by token string
   */
  async findByToken(token: string): Promise<PasswordReset | null> {
    const passwordReset = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    return passwordReset ? this.toDomainEntity(passwordReset) : null;
  }

  /**
   * Delete all tokens for a user
   */
  async deleteUserTokens(userId: string): Promise<number> {
    const result = await this.prisma.passwordReset.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  /**
   * Delete expired tokens
   */
  async deleteExpiredTokens(): Promise<number> {
    const result = await this.prisma.passwordReset.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }
}
