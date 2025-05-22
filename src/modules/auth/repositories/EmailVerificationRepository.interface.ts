import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { EmailVerification, CreateEmailVerificationTokenDto } from '../models/EmailVerification';

export interface IEmailVerificationRepository extends BaseRepository<EmailVerification, string> {
  createToken(data: CreateEmailVerificationTokenDto): Promise<EmailVerification>;
  findByToken(token: string): Promise<EmailVerification | null>;
  deleteToken(token: string): Promise<boolean>;
  deleteUserTokens(userId: string): Promise<number>;
  deleteExpiredTokens(): Promise<number>;
}
