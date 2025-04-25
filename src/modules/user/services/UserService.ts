import { IUserService } from './UserService.interface';
import { UserUpdateAttributes, SafeUser, toSafeUser } from '../models/User';
import { UserStatus } from '../models/UserEnums';
import { IUserRepository } from '../repositories/UserRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

/**
 * User service implementation
 */
export class UserService implements IUserService {
  private userRepository: IUserRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.userRepository = container.resolve<IUserRepository>('userRepository');
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<SafeUser | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return null;
    }

    return toSafeUser(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(id: string, data: UserUpdateAttributes): Promise<SafeUser> {
    // Verify user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    // Update user
    const updatedUser = await this.userRepository.updateUser(id, data);

    return toSafeUser(updatedUser);
  }

  /**
   * Change user status
   */
  async changeStatus(id: string, status: UserStatus): Promise<SafeUser> {
    // Verify user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    // Update status
    const updatedUser = await this.userRepository.updateUser(id, { status });

    return toSafeUser(updatedUser);
  }

  /**
   * Delete user account
   */
  async deleteAccount(id: string): Promise<boolean> {
    // Verify user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    // Soft delete
    return await this.userRepository.softDelete(id);
  }

  /**
   * Search users
   */
  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    users: SafeUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const { users, total } = await this.userRepository.search(query, limit, offset);

    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map((user) => toSafeUser(user)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Update last seen
   */
  async updateLastSeen(id: string): Promise<void> {
    await this.userRepository.updateUser(id, { lastSeenAt: new Date() });
  }
}
