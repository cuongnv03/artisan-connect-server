import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Configuration manager
 */
export class Config {
  // Server configuration
  static PORT = process.env.PORT || '5000';
  static NODE_ENV = process.env.NODE_ENV || 'development';
  static API_PREFIX = process.env.API_PREFIX || '/api';

  // JWT configuration
  static JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
  static JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
  static JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
  static JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

  // Cookie configuration
  static COOKIE_SECRET = process.env.COOKIE_SECRET || 'cookie-secret';
  static REFRESH_TOKEN_COOKIE = 'refresh_token';
  static COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  // CORS configuration
  static CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

  // Bcrypt configuration
  static BCRYPT_SALT_ROUNDS = 10;

  // Cloudinary configuration
  static CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
  static CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
  static CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

  // Gmail configuration
  static EMAIL_HOST = process.env.EMAIL_HOST;
  static EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '465');
  static EMAIL_SECURE = process.env.EMAIL_SECURE;
  static EMAIL_USER = process.env.EMAIL_USER;
  static EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
  static EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME;
  static EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS;
  static CLIENT_URL = process.env.CLIENT_URL;

  /**
   * Get JWT configuration
   */
  static getJwtConfig() {
    return {
      accessTokenSecret: this.JWT_ACCESS_SECRET,
      refreshTokenSecret: this.JWT_REFRESH_SECRET,
      accessTokenExpiration: this.JWT_ACCESS_EXPIRATION,
      refreshTokenExpiration: this.JWT_REFRESH_EXPIRATION,
    };
  }

  /**
   * Get server configuration
   */
  static getServerConfig() {
    return {
      port: this.PORT,
      env: this.NODE_ENV,
      apiPrefix: this.API_PREFIX,
    };
  }

  /**
   * Get cookie configuration
   */
  static getCookieConfig() {
    return {
      secret: this.COOKIE_SECRET,
      refreshTokenName: this.REFRESH_TOKEN_COOKIE,
      maxAge: this.COOKIE_MAX_AGE,
    };
  }

  /**
   * Get CORS configuration
   */
  static getCorsConfig() {
    return {
      origin: this.CORS_ORIGIN,
      credentials: true,
    };
  }

  /**
   * Get Cloudinary configuration
   */
  static getCloudinaryConfig() {
    return {
      cloud_name: this.CLOUDINARY_CLOUD_NAME,
      api_key: this.CLOUDINARY_API_KEY,
      api_secret: this.CLOUDINARY_API_SECRET,
    };
  }

  /**
   * Get email configuration
   */
  static getEmailConfig() {
    return {
      host: this.EMAIL_HOST,
      port: this.EMAIL_PORT,
      secure: this.EMAIL_SECURE,
      user: this.EMAIL_USER,
      password: this.EMAIL_PASSWORD,
      fromName: this.EMAIL_FROM_NAME,
      fromAddress: this.EMAIL_FROM_ADDRESS,
    };
  }
}
