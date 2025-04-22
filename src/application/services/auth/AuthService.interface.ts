import { User } from '../../../domain/user/entities/User';
import {
  RegisterUserDto,
  LoginUserDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AuthResultDto,
} from '../../../domain/auth/dto/auth.dto';

/**
 * Auth service interface
 */
export interface IAuthService {
  /**
   * Register a new user
   */
  register(data: RegisterUserDto): Promise<Omit<User, 'password'>>;

  /**
   * Login user and generate tokens
   */
  login(credentials: LoginUserDto): Promise<AuthResultDto | null>;

  /**
   * Logout user (revoke refresh token)
   */
  logout(refreshToken: string): Promise<boolean>;

  /**
   * Refresh access token using refresh token
   */
  refreshToken(refreshToken: string): Promise<string | null>;

  /**
   * Get user by ID
   */
  getUserById(id: string): Promise<Omit<User, 'password'> | null>;

  /**
   * Send password reset email
   */
  forgotPassword(data: ForgotPasswordDto): Promise<boolean>;

  /**
   * Reset password using token
   */
  resetPassword(data: ResetPasswordDto): Promise<boolean>;

  /**
   * Change user password
   */
  changePassword(userId: string, data: ChangePasswordDto): Promise<boolean>;

  /**
   * Verify email using token
   */
  verifyEmail(token: string): Promise<boolean>;
}
