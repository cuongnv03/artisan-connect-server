import { PrismaClient, EmailVerification as PrismaEmailVerification } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IEmailVerificationRepository } from './EmailVerificationRepository.interface';
import { EmailVerification, CreateEmailVerificationTokenDto } from '../models/EmailVerification';

export class EmailVerificationRepository
  extends BasePrismaRepository<EmailVerification, string>
  implements IEmailVerificationRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, 'emailVerification');
  }

  private toDomainEntity(prismaEntity: PrismaEmailVerification): EmailVerification {
    return prismaEntity as EmailVerification;
  }

  async createToken(data: CreateEmailVerificationTokenDto): Promise<EmailVerification> {
    // Delete existing tokens for user first
    await this.prisma.emailVerification.deleteMany({
      where: { userId: data.userId },
    });

    const token = await this.prisma.emailVerification.create({
      data,
    });
    return this.toDomainEntity(token);
  }

  async findByToken(token: string): Promise<EmailVerification | null> {
    const emailVerification = await this.prisma.emailVerification.findUnique({
      where: { token },
    });
    return emailVerification ? this.toDomainEntity(emailVerification) : null;
  }

  async deleteToken(token: string): Promise<boolean> {
    const result = await this.prisma.emailVerification.deleteMany({
      where: { token },
    });
    return result.count > 0;
  }

  async deleteUserTokens(userId: string): Promise<number> {
    const result = await this.prisma.emailVerification.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = await this.prisma.emailVerification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }
}
