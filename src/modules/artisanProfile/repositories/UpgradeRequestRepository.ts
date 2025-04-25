import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IUpgradeRequestRepository } from './UpgradeRequestRepository.interface';
import {
  ArtisanUpgradeRequest,
  ArtisanUpgradeRequestWithUser,
} from '../models/ArtisanUpgradeRequest';
import { ArtisanUpgradeRequestDto } from '../models/ArtisanProfile';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { UpgradeRequestStatus } from '../models/ArtisanProfileEnums';

export class UpgradeRequestRepository
  extends BasePrismaRepository<ArtisanUpgradeRequest, string>
  implements IUpgradeRequestRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, 'artisanUpgradeRequest');
  }

  /**
   * Find request by user ID
   */
  async findByUserId(userId: string): Promise<ArtisanUpgradeRequest | null> {
    const request = await this.prisma.artisanUpgradeRequest.findUnique({
      where: { userId },
    });

    return request as ArtisanUpgradeRequest | null;
  }

  /**
   * Create upgrade request
   */
  async createUpgradeRequest(
    userId: string,
    data: ArtisanUpgradeRequestDto,
  ): Promise<ArtisanUpgradeRequest> {
    const request = await this.prisma.artisanUpgradeRequest.create({
      data: {
        userId,
        shopName: data.shopName,
        shopDescription: data.shopDescription,
        specialties: data.specialties || [],
        experience: data.experience,
        website: data.website,
        socialMedia: data.socialMedia || {},
        reason: data.reason,
        status: 'PENDING',
      },
    });

    return request as ArtisanUpgradeRequest;
  }

  /**
   * Update upgrade request
   */
  async updateUpgradeRequest(
    id: string,
    data: Partial<ArtisanUpgradeRequest>,
  ): Promise<ArtisanUpgradeRequest> {
    const request = await this.prisma.artisanUpgradeRequest.update({
      where: { id },
      data,
    });

    return request as ArtisanUpgradeRequest;
  }

  /**
   * Get paginated upgrade requests with user details
   */
  async getUpgradeRequests(
    status?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<ArtisanUpgradeRequestWithUser>> {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    // Count total requests
    const total = await this.prisma.artisanUpgradeRequest.count({ where });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Get requests
    const requests = await this.prisma.artisanUpgradeRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: requests as ArtisanUpgradeRequestWithUser[],
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Approve upgrade request and create profile
   */
  async approveRequest(id: string, adminNotes?: string): Promise<ArtisanUpgradeRequest> {
    // Get the request to access userId
    const request = await this.prisma.artisanUpgradeRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    // Create transaction to handle the approval process
    const updatedRequest = await this.prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.artisanUpgradeRequest.update({
        where: { id },
        data: {
          status: UpgradeRequestStatus.APPROVED,
          adminNotes,
        },
      });

      // Update user role
      await tx.user.update({
        where: { id: request.userId },
        data: { role: 'ARTISAN' },
      });

      // Create artisan profile
      await tx.artisanProfile.create({
        data: {
          userId: request.userId,
          shopName: request.shopName,
          shopDescription: request.shopDescription || '',
          specialties: request.specialties || [],
          experience: request.experience,
          website: request.website,
          socialMedia: request.socialMedia || {},
        },
      });

      return updatedRequest;
    });

    return updatedRequest as ArtisanUpgradeRequest;
  }

  /**
   * Reject upgrade request
   */
  async rejectRequest(id: string, adminNotes: string): Promise<ArtisanUpgradeRequest> {
    const request = await this.prisma.artisanUpgradeRequest.update({
      where: { id },
      data: {
        status: UpgradeRequestStatus.REJECTED,
        adminNotes,
      },
    });

    return request as ArtisanUpgradeRequest;
  }
}
