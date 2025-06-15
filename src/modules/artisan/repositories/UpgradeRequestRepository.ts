import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IUpgradeRequestRepository } from './UpgradeRequestRepository.interface';
import {
  ArtisanUpgradeRequest,
  ArtisanUpgradeRequestWithUser,
  CreateUpgradeRequestDto,
  ReviewUpgradeRequestDto,
} from '../models/ArtisanUpgradeRequest';
import { UpgradeRequestStatus } from '../models/ArtisanEnums';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class UpgradeRequestRepository
  extends BasePrismaRepository<ArtisanUpgradeRequest, string>
  implements IUpgradeRequestRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'artisanUpgradeRequest');
  }

  async findByUserId(userId: string): Promise<ArtisanUpgradeRequest | null> {
    try {
      const request = await this.prisma.artisanUpgradeRequest.findUnique({
        where: { userId },
      });

      return request as ArtisanUpgradeRequest | null;
    } catch (error) {
      this.logger.error(`Error finding upgrade request by user ID: ${error}`);
      return null;
    }
  }

  async createRequest(
    userId: string,
    data: CreateUpgradeRequestDto,
  ): Promise<ArtisanUpgradeRequest> {
    try {
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
          images: data.images || [], // Mới thêm
          certificates: data.certificates || [], // Mới thêm
          identityProof: data.identityProof, // Mới thêm
          status: UpgradeRequestStatus.PENDING,
        },
      });

      return request as ArtisanUpgradeRequest;
    } catch (error) {
      this.logger.error(`Error creating upgrade request: ${error}`);
      if ((error as any).code === 'P2002') {
        throw AppError.conflict('User already has a pending upgrade request');
      }
      throw AppError.internal('Failed to create upgrade request', 'DATABASE_ERROR');
    }
  }

  async updateRequest(
    id: string,
    data: Partial<ArtisanUpgradeRequest>,
  ): Promise<ArtisanUpgradeRequest> {
    try {
      const request = await this.prisma.artisanUpgradeRequest.update({
        where: { id },
        data,
      });

      return request as ArtisanUpgradeRequest;
    } catch (error) {
      this.logger.error(`Error updating upgrade request: ${error}`);
      if ((error as any).code === 'P2025') {
        throw AppError.notFound('Upgrade request not found');
      }
      throw AppError.internal('Failed to update upgrade request', 'DATABASE_ERROR');
    }
  }

  async getRequests(
    status?: UpgradeRequestStatus,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<ArtisanUpgradeRequestWithUser>> {
    try {
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      // Get total count
      const total = await this.prisma.artisanUpgradeRequest.count({ where });

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
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      return {
        data: requests as ArtisanUpgradeRequestWithUser[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting upgrade requests: ${error}`);
      throw AppError.internal('Failed to get upgrade requests', 'DATABASE_ERROR');
    }
  }

  async reviewRequest(
    id: string,
    reviewData: ReviewUpgradeRequestDto,
  ): Promise<ArtisanUpgradeRequest> {
    try {
      const request = await this.prisma.artisanUpgradeRequest.update({
        where: { id },
        data: {
          status: reviewData.status,
          adminNotes: reviewData.adminNotes,
          reviewedBy: reviewData.reviewedBy,
          reviewedAt: new Date(),
        },
      });

      return request as ArtisanUpgradeRequest;
    } catch (error) {
      this.logger.error(`Error reviewing upgrade request: ${error}`);
      throw AppError.internal('Failed to review upgrade request', 'DATABASE_ERROR');
    }
  }

  async approveRequest(
    id: string,
    adminId: string,
    adminNotes?: string,
  ): Promise<ArtisanUpgradeRequest> {
    try {
      // Get the request to access user information
      const request = await this.prisma.artisanUpgradeRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw AppError.notFound('Upgrade request not found');
      }

      // Use transaction to handle the approval process
      const updatedRequest = await this.prisma.$transaction(async (tx) => {
        // Update request status
        const updatedRequest = await tx.artisanUpgradeRequest.update({
          where: { id },
          data: {
            status: UpgradeRequestStatus.APPROVED,
            adminNotes,
            reviewedBy: adminId,
            reviewedAt: new Date(),
          },
        });

        // Update user role to artisan
        await tx.user.update({
          where: { id: request.userId },
          data: { role: 'ARTISAN' },
        });

        // Create artisan profile
        await tx.artisanProfile.create({
          data: {
            userId: request.userId,
            shopName: request.shopName,
            shopDescription: request.shopDescription,
            specialties: request.specialties || [],
            experience: request.experience,
            website: request.website,
            socialMedia: request.socialMedia || {},
            totalSales: 0, // Khởi tạo = 0
          },
        });

        return updatedRequest;
      });

      return updatedRequest as ArtisanUpgradeRequest;
    } catch (error) {
      this.logger.error(`Error approving upgrade request: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to approve upgrade request', 'DATABASE_ERROR');
    }
  }

  async rejectRequest(
    id: string,
    adminId: string,
    adminNotes: string,
  ): Promise<ArtisanUpgradeRequest> {
    try {
      const request = await this.prisma.artisanUpgradeRequest.update({
        where: { id },
        data: {
          status: UpgradeRequestStatus.REJECTED,
          adminNotes,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      return request as ArtisanUpgradeRequest;
    } catch (error) {
      this.logger.error(`Error rejecting upgrade request: ${error}`);
      throw AppError.internal('Failed to reject upgrade request', 'DATABASE_ERROR');
    }
  }
}
