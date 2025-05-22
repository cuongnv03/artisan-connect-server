import { PrismaClient, User as PrismaUser } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { User, UserCreationAttributes, UserUpdateAttributes } from '../models/User';
import { UserRole } from '../models/UserEnums';
import { IUserRepository } from './UserRepository.interface';
import { AppError } from '../../../core/errors/AppError';

export class UserRepository extends BasePrismaRepository<User, string> implements IUserRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'user');
  }

  private toDomainEntity(prismaUser: PrismaUser): User {
    return prismaUser as User;
  }

  async findById(id: string): Promise<User | null> {
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
}
