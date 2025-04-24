import { UserRole } from './../valueObjects/UserEnums';
import { User, UserCreationAttributes, UserUpdateAttributes } from '../entities/User';
import { BaseRepository } from '../../repositories/BaseRepository';

/**
 * User repository interface
 *
 * Defines methods to interact with user data storage
 */
export interface IUserRepository extends BaseRepository<User, string> {
  /**
   * Find a user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find a user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find a user by username
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Find a user by email or username
   */
  findByEmailOrUsername(emailOrUsername: string): Promise<User | null>;

  /**
   * Create a new user
   */
  createUser(data: UserCreationAttributes): Promise<User>;

  /**
   * Update a user
   */
  updateUser(id: string, data: UserUpdateAttributes): Promise<User>;

  /**
   * Update user role
   */
  updateUserRole(userId: string, role: UserRole): Promise<User>;

  /**
   * Soft delete a user
   */
  softDelete(id: string): Promise<boolean>;

  /**
   * Search for users
   */
  search(query: string, limit: number, offset: number): Promise<{ users: User[]; total: number }>;

  /**
   * Check if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Check if username exists
   */
  usernameExists(username: string): Promise<boolean>;
}
