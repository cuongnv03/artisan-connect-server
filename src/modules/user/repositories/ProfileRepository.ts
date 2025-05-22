import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IProfileRepository } from './ProfileRepository.interface';
import { Profile, ProfileWithUser, UpdateProfileDto } from '../models/Profile';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class ProfileRepository
  extends BasePrismaRepository<Profile, string>
  implements IProfileRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'profile');
  }

  async findByUserId(userId: string): Promise<ProfileWithUser | null> {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      return profile as ProfileWithUser | null;
    } catch (error) {
      this.logger.error(`Error finding profile by user ID: ${error}`);
      return null;
    }
  }

  async ensureProfile(userId: string): Promise<Profile> {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      // Check if profile exists
      let profile = await this.prisma.profile.findUnique({
        where: { userId },
      });

      // Create profile if it doesn't exist
      if (!profile) {
        profile = await this.prisma.profile.create({
          data: {
            userId,
          },
        });
      }

      return profile as Profile;
    } catch (error) {
      this.logger.error(`Error ensuring profile: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to ensure profile', 'DATABASE_ERROR');
    }
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<ProfileWithUser> {
    try {
      // Ensure profile exists
      await this.ensureProfile(userId);

      // Prepare date of birth if provided as string
      const updateData = { ...data };
      if (typeof updateData.dateOfBirth === 'string' && updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }

      // Update profile
      const profile = await this.prisma.profile.update({
        where: { userId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      return profile as ProfileWithUser;
    } catch (error) {
      this.logger.error(`Error updating profile: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update profile', 'DATABASE_ERROR');
    }
  }
}
