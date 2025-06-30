import { PrismaClient, User as PrismaUser } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { User, UserCreationAttributes, UserUpdateAttributes } from '../models/User';
import { UserRole, UserStatus } from '../models/UserEnums';
import { IUserRepository } from './UserRepository.interface';
import { AppError } from '../../../core/errors/AppError';

export class UserRepository extends BasePrismaRepository<User, string> implements IUserRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'user');
  }

  private toDomainEntity(prismaUser: PrismaUser): User {
    return prismaUser as User;
  }

  override async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? this.toDomainEntity(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user ? this.toDomainEntity(user) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    return user ? this.toDomainEntity(user) : null;
  }

  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });
    return user ? this.toDomainEntity(user) : null;
  }

  async createUser(data: UserCreationAttributes): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          ...data,
          // Đảm bảo follower counts được khởi tạo với 0
          followerCount: 0,
          followingCount: 0,
          profile: {
            create: {}, // Create empty profile
          },
        },
      });
      return this.toDomainEntity(user);
    } catch (error) {
      if ((error as any).code === 'P2002') {
        const target = (error as any).meta?.target[0];
        throw AppError.conflict(`${target} already exists`);
      }
      throw error;
    }
  }

  async updateUser(id: string, data: UserUpdateAttributes): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return this.toDomainEntity(user);
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    return this.toDomainEntity(user);
  }

  async softDelete(id: string): Promise<boolean> {
    await this.prisma.user.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
    return true;
  }

  async search(
    query: string,
    limit: number,
    offset: number,
  ): Promise<{ users: User[]; total: number }> {
    const searchCondition = query
      ? {
          OR: [
            { email: { contains: query, mode: 'insensitive' as const } },
            { username: { contains: query, mode: 'insensitive' as const } },
            { firstName: { contains: query, mode: 'insensitive' as const } },
            { lastName: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const total = await this.prisma.user.count({
      where: {
        ...searchCondition,
        status: { not: 'DELETED' },
        deletedAt: null,
      },
    });

    const users = await this.prisma.user.findMany({
      where: {
        ...searchCondition,
        status: { not: 'DELETED' },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    return {
      users: users.map(this.toDomainEntity),
      total,
    };
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  async usernameExists(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username },
    });
    return count > 0;
  }

  async adminSearchUsers(
    query: string,
    filters: {
      role?: UserRole;
      status?: UserStatus;
      verified?: boolean;
    },
    limit: number,
    offset: number,
  ): Promise<{ users: User[]; total: number }> {
    const whereConditions: any = {
      deletedAt: null, // Không lấy user đã bị xóa
    };

    // Search by query (name, email, username)
    if (query) {
      whereConditions.OR = [
        { email: { contains: query, mode: 'insensitive' as const } },
        { username: { contains: query, mode: 'insensitive' as const } },
        { firstName: { contains: query, mode: 'insensitive' as const } },
        { lastName: { contains: query, mode: 'insensitive' as const } },
      ];
    }

    // Apply filters
    if (filters.role) {
      whereConditions.role = filters.role;
    }

    if (filters.status) {
      whereConditions.status = filters.status;
    }

    if (filters.verified !== undefined) {
      whereConditions.isVerified = filters.verified;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereConditions,
        include: {
          profile: {
            select: {
              location: true,
              website: true,
              dateOfBirth: true,
            },
          },
          artisanProfile: {
            select: {
              shopName: true,
              isVerified: true,
              rating: true,
              reviewCount: true,
              totalSales: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.user.count({ where: whereConditions }),
    ]);

    return {
      users: users.map(this.toDomainEntity),
      total,
    };
  }

  async getUserWithDetails(id: string): Promise<
    | (User & {
        profile?: any;
        artisanProfile?: any;
      })
    | null
  > {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            addresses: {
              orderBy: { isDefault: 'desc' },
            },
          },
        },
        artisanProfile: true,
        _count: {
          select: {
            posts: true,
            products: true,
            orders: true,
            sellerOrders: true,
          },
        },
      },
    });

    return user ? (user as any) : null;
  }

  async adminSoftDelete(id: string, adminId: string): Promise<boolean> {
    // Prevent admin from deleting themselves
    if (id === adminId) {
      throw AppError.badRequest('Cannot delete your own account', 'SELF_DELETE');
    }

    // Check if user exists and not already deleted
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    if (user.deletedAt) {
      throw AppError.badRequest('User already deleted', 'ALREADY_DELETED');
    }

    // Soft delete user
    await this.prisma.user.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });

    return true;
  }

  async getUserStats(): Promise<{
    total: number;
    byRole: Record<UserRole, number>;
    byStatus: Record<UserStatus, number>;
    verified: number;
    unverified: number;
  }> {
    const [total, roleStats, statusStats, verifiedCount, unverifiedCount] = await Promise.all([
      // Total users (not deleted)
      this.prisma.user.count({
        where: { deletedAt: null },
      }),

      // By role
      this.prisma.user.groupBy({
        by: ['role'],
        where: { deletedAt: null },
        _count: { role: true },
      }),

      // By status
      this.prisma.user.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { status: true },
      }),

      // Verified users
      this.prisma.user.count({
        where: {
          deletedAt: null,
          isVerified: true,
        },
      }),

      // Unverified users
      this.prisma.user.count({
        where: {
          deletedAt: null,
          isVerified: false,
        },
      }),
    ]);

    // Convert arrays to objects
    const byRole = {} as Record<UserRole, number>;
    roleStats.forEach((stat) => {
      byRole[stat.role as UserRole] = stat._count.role;
    });

    const byStatus = {} as Record<UserStatus, number>;
    statusStats.forEach((stat) => {
      byStatus[stat.status as UserStatus] = stat._count.status;
    });

    return {
      total,
      byRole,
      byStatus,
      verified: verifiedCount,
      unverified: unverifiedCount,
    };
  }
}
