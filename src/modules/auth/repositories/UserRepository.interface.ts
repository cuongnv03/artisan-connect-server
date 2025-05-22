import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { User, UserCreationAttributes, UserUpdateAttributes } from '../models/User';
import { UserRole } from '../models/UserEnums';

export interface IUserRepository extends BaseRepository<User, string> {
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmailOrUsername(emailOrUsername: string): Promise<User | null>;
  createUser(data: UserCreationAttributes): Promise<User>;
  updateUser(id: string, data: UserUpdateAttributes): Promise<User>;
  updateUserRole(userId: string, role: UserRole): Promise<User>;
  softDelete(id: string): Promise<boolean>;
  search(query: string, limit: number, offset: number): Promise<{ users: User[]; total: number }>;
  emailExists(email: string): Promise<boolean>;
  usernameExists(username: string): Promise<boolean>;
}
