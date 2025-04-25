import { PrismaClient, EmailVerification as PrismaEmailVerification } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IEmailVerificationRepository } from '../domain/repositories/EmailVerificationRepository.interface';
import {
  EmailVerification,
  CreateEmailVerificationTokenDto,
} from '../domain/entities/EmailVerification';

/**
 * Email verification repository implementation
 */
export class EmailVerificationRepository
  extends BasePrismaRepository<EmailVerification, string>
  implements IEmailVerificationRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, 'emailVerification');
  }

  /**
   * Convert Prisma entity to domain entity
   */
  private toDomainEntity(prismaEntity: PrismaEmailVerification): EmailVerification {
    return prismaEntity as EmailVerification;
  }

  /**
   * Create a new email verification token
   */
  async createToken(data: CreateEmailVerificationTokenDto): Promise<EmailVerification> {
    // Delete existing tokens for user first
    await this.prisma.emailVerification.deleteMany({
      where: { userId: data.userId },
    });

    // Create new token
    const token = await this.prisma.emailVerification.create({
      data,
    });

    return this.toDomainEntity(token);
  }

  /**
   * Find token by token string
   */
  async findByToken(token: string): Promise<EmailVerification | null> {
    const emailVerification = await this.prisma.emailVerification.findUnique({
      where: { token },
    });

    return emailVerification ? this.toDomainEntity(emailVerification) : null;
  }

  /**
   * Delete token by token string
   */
  async deleteToken(token: string): Promise<boolean> {
    const result = await this.prisma.emailVerification.deleteMany({
      where: { token },
    });

    return result.count > 0;
  }

  /**
   * Delete all tokens for a user
   */
  async deleteUserTokens(userId: string): Promise<number> {
    const result = await this.prisma.emailVerification.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  /**
   * Delete expired tokens
   */
  async deleteExpiredTokens(): Promise<number> {
    const result = await this.prisma.emailVerification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }
}
