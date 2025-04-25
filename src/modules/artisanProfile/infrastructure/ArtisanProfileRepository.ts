import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IArtisanProfileRepository } from '../domain/repositories/ArtisanProfileRepository.interface';
import {
  ArtisanProfile,
  ArtisanProfileWithUser,
  CreateArtisanProfileDto,
  UpdateArtisanProfileDto,
} from '../domain/entities/ArtisanProfile';

export class ArtisanProfileRepository
  extends BasePrismaRepository<ArtisanProfile, string>
  implements IArtisanProfileRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, 'artisanProfile');
  }

  /**
   * Find profile by user ID
   */
  async findByUserId(userId: string): Promise<ArtisanProfileWithUser | null> {
    const profile = await this.prisma.artisanProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return profile as ArtisanProfileWithUser | null;
  }

  /**
   * Create artisan profile
   */
  async createProfile(
    userId: string,
    data: CreateArtisanProfileDto,
  ): Promise<ArtisanProfileWithUser> {
    const profile = await this.prisma.artisanProfile.create({
      data: {
        userId,
        shopName: data.shopName,
        shopDescription: data.shopDescription,
        specialties: data.specialties || [],
        experience: data.experience,
        website: data.website,
        socialMedia: data.socialMedia || {},
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return profile as ArtisanProfileWithUser;
  }

  /**
   * Update artisan profile
   */
  async updateProfile(
    userId: string,
    data: UpdateArtisanProfileDto,
  ): Promise<ArtisanProfileWithUser> {
    const profile = await this.prisma.artisanProfile.update({
      where: { userId },
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return profile as ArtisanProfileWithUser;
  }

  /**
   * Find profile by ID with user details
   */
  async findByIdWithUser(id: string): Promise<ArtisanProfileWithUser | null> {
    const profile = await this.prisma.artisanProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return profile as ArtisanProfileWithUser | null;
  }
}
