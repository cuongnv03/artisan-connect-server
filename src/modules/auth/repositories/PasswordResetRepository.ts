import { PrismaClient, PasswordReset as PrismaPasswordReset } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IPasswordResetRepository } from './PasswordResetRepository.interface';
import { PasswordReset, CreatePasswordResetTokenDto } from '../models/PasswordReset';

export class PasswordResetRepository
  extends BasePrismaRepository<PasswordReset, string>
  implements IPasswordResetRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, 'passwordReset');
  }

  private toDomainEntity(prismaEntity: PrismaPasswordReset): PasswordReset {
    return prismaEntity as PasswordReset;
  }

  async createToken(data: CreatePasswordResetTokenDto): Promise<PasswordReset> {
    // Delete existing tokens for user first
    await this.prisma.passwordReset.deleteMany({
      where: { userId: data.userId },
    });

    const token = await this.prisma.passwordReset.create({
      data,
    });
    return this.toDomainEntity(token);
  }

  async findByToken(token: string): Promise<PasswordReset | null> {
    const passwordReset = await this.prisma.passwordReset.findUnique({
      where: { token },
    });
    return passwordReset ? this.toDomainEntity(passwordReset) : null;
  }

  async deleteUserTokens(userId: string): Promise<number> {
    const result = await this.prisma.passwordReset.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = await this.prisma.passwordReset.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }
}
