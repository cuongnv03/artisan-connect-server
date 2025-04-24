import { PrismaClient, User as PrismaUser, Prisma } from '@prisma/client';
import { BasePrismaRepository } from './BasePrismaRepository';
import {
  User,
  UserCreationAttributes,
  UserUpdateAttributes,
} from '../../../domain/user/entities/User';
import { UserRole } from './../../../domain/user/valueObjects/UserEnums';
import { IUserRepository } from '../../../domain/user/repositories/UserRepository.interface';
import { AppError } from '../../../shared/errors/AppError';

/**
 * User repository implementation using Prisma
 */
export class UserRepository extends BasePrismaRepository<User, string> implements IUserRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'user');
  }

  /**
   * Convert Prisma User to Domain User
   */
  private toDomainEntity(prismaUser: PrismaUser & { artisanProfile?: any }): User {
    return prismaUser as User;
  }

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { artisanProfile: true },
    });

    return user ? this.toDomainEntity(user) : null;
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? this.toDomainEntity(user) : null;
  }

  /**
   * Find a user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    return user ? this.toDomainEntity(user) : null;
  }

  /**
   * Find a user by email or username
   */
  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });

    return user ? this.toDomainEntity(user) : null;
  }

  /**
   * Create a new user
   */
  async createUser(data: UserCreationAttributes): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          ...data,
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

  /**
   * Update a user
   */
  async updateUser(id: string, data: UserUpdateAttributes): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.toDomainEntity(user);
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return this.toDomainEntity(user);
  }

  /**
   * Soft delete a user
   */
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

  /**
   * Search for users
   */
  async search(
    query: string,
    limit: number,
    offset: number,
  ): Promise<{ users: User[]; total: number }> {
    // Prepare search conditions
    const searchCondition = query
      ? {
          OR: [
            { email: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { username: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { firstName: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { lastName: { contains: query, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    // Get total count
    const total = await this.prisma.user.count({
      where: {
        ...searchCondition,
        status: { not: 'DELETED' },
        deletedAt: null,
      },
    });

    // Get users
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

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });

    return count > 0;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username },
    });

    return count > 0;
  }
}
