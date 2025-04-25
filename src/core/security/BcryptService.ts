import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError';

/**
 * Password handling service using bcrypt
 */
export class BcryptService {
  private readonly saltRounds: number;

  constructor(saltRounds: number = 10) {
    this.saltRounds = saltRounds;
  }

  /**
   * Hash a password
   */
  async hash(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw AppError.internal('Password hashing failed');
    }
  }

  /**
   * Compare a password with its hash
   */
  async compare(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw AppError.internal('Password comparison failed');
    }
  }
}
