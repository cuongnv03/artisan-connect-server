import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IArtisanProfileRepository } from './ArtisanProfileRepository.interface';
import {
  ArtisanProfile,
  ArtisanProfileWithUser,
  CreateArtisanProfileDto,
  UpdateArtisanProfileDto,
  ArtisanSearchFilters,
} from '../models/ArtisanProfile';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class ArtisanProfileRepository
  extends BasePrismaRepository<ArtisanProfile, string>
  implements IArtisanProfileRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'artisanProfile');
  }

  async findByUserId(userId: string): Promise<ArtisanProfileWithUser | null> {
    try {
      const profile = await this.prisma.artisanProfile.findUnique({
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
              followerCount: true,
            },
          },
        },
      });

      return profile as ArtisanProfileWithUser | null;
    } catch (error) {
      this.logger.error(`Error finding artisan profile by user ID: ${error}`);
      return null;
    }
  }

  async createProfile(
    userId: string,
    data: CreateArtisanProfileDto,
  ): Promise<ArtisanProfileWithUser> {
    try {
      const profile = await this.prisma.artisanProfile.create({
        data: {
          userId,
          shopName: data.shopName,
          shopDescription: data.shopDescription,
          specialties: data.specialties || [],
          experience: data.experience,
          website: data.website,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          socialMedia: data.socialMedia || {},
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              avatarUrl: true,
              followerCount: true,
            },
          },
        },
      });

      return profile as ArtisanProfileWithUser;
    } catch (error) {
      this.logger.error(`Error creating artisan profile: ${error}`);
      if ((error as any).code === 'P2002') {
        throw AppError.conflict('User already has an artisan profile');
      }
      throw AppError.internal('Failed to create artisan profile', 'DATABASE_ERROR');
    }
  }

  async updateProfile(
    userId: string,
    data: UpdateArtisanProfileDto,
  ): Promise<ArtisanProfileWithUser> {
    try {
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
              username: true,
              avatarUrl: true,
              followerCount: true,
            },
          },
        },
      });

      return profile as ArtisanProfileWithUser;
    } catch (error) {
      this.logger.error(`Error updating artisan profile: ${error}`);
      if ((error as any).code === 'P2025') {
        throw AppError.notFound('Artisan profile not found');
      }
      throw AppError.internal('Failed to update artisan profile', 'DATABASE_ERROR');
    }
  }

  async findByIdWithUser(id: string): Promise<ArtisanProfileWithUser | null> {
    try {
      const profile = await this.prisma.artisanProfile.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              avatarUrl: true,
              followerCount: true,
            },
          },
        },
      });

      return profile as ArtisanProfileWithUser | null;
    } catch (error) {
      this.logger.error(`Error finding artisan profile by ID: ${error}`);
      return null;
    }
  }

  async searchArtisans(
    filters: ArtisanSearchFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<ArtisanProfileWithUser>> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.ArtisanProfileWhereInput = {};

      if (filters.search) {
        where.OR = [
          { shopName: { contains: filters.search, mode: 'insensitive' } },
          { shopDescription: { contains: filters.search, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { username: { contains: filters.search, mode: 'insensitive' } },
              ],
            },
          },
        ];
      }

      if (filters.specialties && filters.specialties.length > 0) {
        where.specialties = { hasSome: filters.specialties };
      }

      if (filters.minRating !== undefined) {
        where.rating = { gte: filters.minRating };
      }

      if (filters.isVerified !== undefined) {
        where.isVerified = filters.isVerified;
      }

      // Build order by clause
      const orderBy: Prisma.ArtisanProfileOrderByWithRelationInput = {};

      switch (filters.sortBy) {
        case 'rating':
          orderBy.rating = filters.sortOrder || 'desc';
          break;
        case 'reviewCount':
          orderBy.reviewCount = filters.sortOrder || 'desc';
          break;
        case 'followCount':
          orderBy.user = { followerCount: filters.sortOrder || 'desc' };
          break;
        case 'createdAt':
        default:
          orderBy.createdAt = filters.sortOrder || 'desc';
          break;
      }

      // Get total count
      const total = await this.prisma.artisanProfile.count({ where });

      // Get artisan profiles
      const profiles = await this.prisma.artisanProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              avatarUrl: true,
              followerCount: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      });

      return {
        data: profiles as ArtisanProfileWithUser[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error searching artisans: ${error}`);
      throw AppError.internal('Failed to search artisans', 'DATABASE_ERROR');
    }
  }

  async updateRating(profileId: string, newRating: number, reviewCount: number): Promise<void> {
    try {
      await this.prisma.artisanProfile.update({
        where: { id: profileId },
        data: {
          rating: newRating,
          reviewCount,
        },
      });
    } catch (error) {
      this.logger.error(`Error updating artisan rating: ${error}`);
      throw AppError.internal('Failed to update artisan rating', 'DATABASE_ERROR');
    }
  }

  async getTopArtisans(limit: number): Promise<ArtisanProfileWithUser[]> {
    try {
      const profiles = await this.prisma.artisanProfile.findMany({
        where: {
          isVerified: true,
          rating: { not: null },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              avatarUrl: true,
              followerCount: true,
            },
          },
        },
        orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }, { user: { followerCount: 'desc' } }],
        take: limit,
      });

      return profiles as ArtisanProfileWithUser[];
    } catch (error) {
      this.logger.error(`Error getting top artisans: ${error}`);
      throw AppError.internal('Failed to get top artisans', 'DATABASE_ERROR');
    }
  }

  async getArtisansBySpecialty(
    specialty: string,
    limit: number,
  ): Promise<ArtisanProfileWithUser[]> {
    try {
      const profiles = await this.prisma.artisanProfile.findMany({
        where: {
          specialties: { has: specialty },
          isVerified: true,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              avatarUrl: true,
              followerCount: true,
            },
          },
        },
        orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
        take: limit,
      });

      return profiles as ArtisanProfileWithUser[];
    } catch (error) {
      this.logger.error(`Error getting artisans by specialty: ${error}`);
      throw AppError.internal('Failed to get artisans by specialty', 'DATABASE_ERROR');
    }
  }

  async verifyArtisan(profileId: string, isVerified: boolean): Promise<ArtisanProfile> {
    try {
      const profile = await this.prisma.artisanProfile.update({
        where: { id: profileId },
        data: { isVerified },
      });

      return profile as ArtisanProfile;
    } catch (error) {
      this.logger.error(`Error verifying artisan: ${error}`);
      throw AppError.internal('Failed to verify artisan', 'DATABASE_ERROR');
    }
  }
}
