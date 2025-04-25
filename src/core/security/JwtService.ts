import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

export interface TokenPayload {
  userId: string;
  role: string;
}

export interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiration: string;
  refreshTokenExpiration: string;
}

/**
 * JWT Service for token generation and verification
 */
export class JwtService {
  private config: JwtConfig;

  constructor(config: JwtConfig) {
    this.config = config;
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: TokenPayload): string {
    try {
      return jwt.sign(payload, this.config.accessTokenSecret, {
        expiresIn: this.config.accessTokenExpiration,
      });
    } catch (error) {
      throw AppError.internal('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: TokenPayload): string {
    try {
      return jwt.sign(payload, this.config.refreshTokenSecret, {
        expiresIn: this.config.refreshTokenExpiration,
      });
    } catch (error) {
      throw AppError.internal('Failed to generate refresh token');
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.config.accessTokenSecret) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.config.refreshTokenSecret) as TokenPayload;
    } catch (error) {
      return null;
    }
  }
}
