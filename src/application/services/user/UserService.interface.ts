import { User, UserUpdateAttributes, SafeUser } from '../../../domain/user/entities/User';
import { UserStatus } from '../../../domain/user/valueObjects/UserEnums';

/**
 * User service interface
 */
export interface IUserService {
  /**
   * Get user by ID
   */
  getUserById(id: string): Promise<SafeUser | null>;

  /**
   * Update user profile
   */
  updateProfile(id: string, data: UserUpdateAttributes): Promise<SafeUser>;

  /**
   * Change user status
   */
  changeStatus(id: string, status: UserStatus): Promise<SafeUser>;

  /**
   * Delete user account
   */
  deleteAccount(id: string): Promise<boolean>;

  /**
   * Search users
   */
  searchUsers(
    query: string,
    page: number,
    limit: number,
  ): Promise<{
    users: SafeUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /**
   * Update last seen
   */
  updateLastSeen(id: string): Promise<void>;
}
