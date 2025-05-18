import { IAuthService } from './AuthService.interface';
import {
  RegisterUserDto,
  LoginUserDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AuthResultDto,
} from '../models/AuthDto';
import { User, toSafeUser, UserUpdateAttributes } from '../models/User';
import { IUserRepository } from '../repositories/UserRepository.interface';
import { IRefreshTokenRepository } from '../repositories/RefreshTokenRepository.interface';
import { IPasswordResetRepository } from '../repositories/PasswordResetRepository.interface';
import { IEmailVerificationRepository } from '../repositories/EmailVerificationRepository.interface';
import { BcryptService } from '../../../core/infrastructure/security/BcryptService';
import { JwtService } from '../../../core/infrastructure/security/JwtService';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { v4 as uuidv4 } from 'uuid';
import container from '../../../core/di/container';

/**
 * Auth service implementation
 */
export class AuthService implements IAuthService {
  private userRepository: IUserRepository;
  private refreshTokenRepository: IRefreshTokenRepository;
  private passwordResetRepository: IPasswordResetRepository;
  private emailVerificationRepository: IEmailVerificationRepository;
  private bcryptService: BcryptService;
  private jwtService: JwtService;
  private logger = Logger.getInstance();

  constructor() {
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.refreshTokenRepository =
      container.resolve<IRefreshTokenRepository>('refreshTokenRepository');
    this.passwordResetRepository =
      container.resolve<IPasswordResetRepository>('passwordResetRepository');
    this.emailVerificationRepository = container.resolve<IEmailVerificationRepository>(
      'emailVerificationRepository',
    );
    this.bcryptService = container.resolve<BcryptService>('bcryptService');
    this.jwtService = container.resolve<JwtService>('jwtService');
  }

  /**
   * Register a new user
   */
  async register(data: RegisterUserDto): Promise<Omit<User, 'password'>> {
    // Check if email already exists
    const emailExists = await this.userRepository.emailExists(data.email);
    if (emailExists) {
      throw AppError.conflict('Email already in use', 'EMAIL_IN_USE');
    }

    // Generate username from email if not provided
    let username = data.username;
    if (!username) {
      username = data.email.split('@')[0] + Math.floor(Math.random() * 1000);
    }

    // Check if username already exists
    const usernameExists = await this.userRepository.usernameExists(username);
    if (usernameExists) {
      throw AppError.conflict('Username already in use', 'USERNAME_IN_USE');
    }

    // Hash password
    const hashedPassword = await this.bcryptService.hash(data.password);

    // Create user
    const user = await this.userRepository.createUser({
      email: data.email,
      username,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: (data.role as any) || 'CUSTOMER',
    });

    // Return user without password
    return toSafeUser(user);
  }

  /**
   * Login user and generate tokens
   */
  async login(credentials: LoginUserDto): Promise<AuthResultDto | null> {
    try {
      // Find user by email or username
      const user = await this.userRepository.findByEmailOrUsername(credentials.emailOrUsername);
      if (!user) {
        return null;
      }

      // Verify password
      const isPasswordValid = await this.bcryptService.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        throw AppError.forbidden('Account is not active', 'ACCOUNT_INACTIVE');
      }

      // Generate tokens
      const accessToken = this.jwtService.generateAccessToken({
        userId: user.id,
        role: user.role,
      });

      const refreshToken = this.jwtService.generateRefreshToken({
        userId: user.id,
        role: user.role,
      });

      // Calculate token expiration based on rememberMe option
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (credentials.rememberMe ? 30 : 7));

      // Save refresh token
      await this.refreshTokenRepository.createToken({
        userId: user.id,
        token: refreshToken,
        expiresAt,
      });

      // Update last seen
      await this.userRepository.updateUser(user.id, {
        lastSeenAt: new Date(),
      });

      // Prepare user data for response
      const { password: _, ...userWithoutPassword } = user as User & { password: string };

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(`Login error: ${error}`);
      throw error;
    }
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<boolean> {
    try {
      if (!refreshToken) {
        return false;
      }

      // Revoke the token
      return await this.refreshTokenRepository.revokeToken(refreshToken);
    } catch (error) {
      this.logger.error(`Logout error: ${error}`);
      return false;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<string | null> {
    try {
      // Validate token
      const payload = this.jwtService.verifyRefreshToken(refreshToken);
      if (!payload) {
        return null;
      }

      // Check if token exists in database and is not revoked
      const tokenEntity = await this.refreshTokenRepository.findByToken(refreshToken);
      if (!tokenEntity || tokenEntity.revokedAt || new Date() > tokenEntity.expiresAt) {
        return null;
      }

      // Check if user exists
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        return null;
      }

      // Generate new access token
      return this.jwtService.generateAccessToken({
        userId: user.id,
        role: user.role,
      });
    } catch (error) {
      this.logger.error(`Refresh token error: ${error}`);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return null;
    }

    return toSafeUser(user);
  }

  /**
   * Send password reset email
   * Note: Email sending is removed, we just create the token
   */
  async forgotPassword(data: ForgotPasswordDto): Promise<boolean> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(data.email);
      if (!user) {
        // For security reasons, still return true even if email doesn't exist
        return true;
      }

      // Generate reset token
      const resetToken = uuidv4();

      // Set expiration (1 hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Save token to database
      await this.passwordResetRepository.createToken({
        userId: user.id,
        token: resetToken,
        expiresAt,
      });

      // Email sending removed
      this.logger.info(`Password reset token created for user ${user.id}`);

      return true;
    } catch (error) {
      this.logger.error(`Forgot password error: ${error}`);
      return false;
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(data: ResetPasswordDto): Promise<boolean> {
    try {
      // Find token
      const tokenEntity = await this.passwordResetRepository.findByToken(data.token);
      if (!tokenEntity || new Date() > tokenEntity.expiresAt) {
        return false;
      }

      // Hash new password
      const hashedPassword = await this.bcryptService.hash(data.newPassword);

      // Update user password
      await this.userRepository.updateUser(tokenEntity.userId, {
        password: hashedPassword,
      } as unknown as UserUpdateAttributes);

      // Delete used token
      await this.passwordResetRepository.deleteUserTokens(tokenEntity.userId);

      // Revoke all refresh tokens for this user
      await this.refreshTokenRepository.revokeAllUserTokens(tokenEntity.userId);

      return true;
    } catch (error) {
      this.logger.error(`Reset password error: ${error}`);
      return false;
    }
  }

  /**
   * Send email verification token
   * Note: Email sending is removed, we just create the token
   */
  async sendVerificationEmail(userId: string): Promise<boolean> {
    try {
      // Find user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }

      // If already verified
      if (user.emailVerified) {
        return true;
      }

      // Generate verification token
      const verificationToken = uuidv4();

      // Set expiration (24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Save token to database
      await this.emailVerificationRepository.createToken({
        userId: user.id,
        token: verificationToken,
        expiresAt,
      });

      // Email sending removed
      this.logger.info(`Verification token created for user ${user.id}`);

      return true;
    } catch (error) {
      this.logger.error(`Send verification email error: ${error}`);
      return false;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, data: ChangePasswordDto): Promise<boolean> {
    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.bcryptService.compare(
        data.currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw AppError.badRequest('Current password is incorrect', 'INVALID_PASSWORD');
      }

      // Hash new password
      const hashedPassword = await this.bcryptService.hash(data.newPassword);

      // Update user password
      await this.userRepository.updateUser(userId, { password: hashedPassword } as any);

      // Revoke all refresh tokens for this user
      await this.refreshTokenRepository.revokeAllUserTokens(userId);

      return true;
    } catch (error) {
      this.logger.error(`Change password error: ${error}`);
      throw error;
    }
  }

  /**
   * Verify email using token
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      // Find token
      const tokenEntity = await this.emailVerificationRepository.findByToken(token);
      if (!tokenEntity || new Date() > tokenEntity.expiresAt) {
        return false;
      }

      // Update user email verification status
      await this.userRepository.updateUser(tokenEntity.userId, { emailVerified: true });

      // Delete used token
      await this.emailVerificationRepository.deleteToken(token);

      return true;
    } catch (error) {
      this.logger.error(`Verify email error: ${error}`);
      return false;
    }
  }
}
