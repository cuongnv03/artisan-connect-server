import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Configuration manager with validation
 */
export class Config {
  // Server configuration
  static PORT = process.env.PORT || '5000';
  static NODE_ENV = process.env.NODE_ENV || 'development';
  static API_PREFIX = process.env.API_PREFIX || '/api';

  // Database configuration
  static DATABASE_URL = process.env.DATABASE_URL || '';

  // JWT configuration
  static JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || this.generateFallbackSecret('access');
  static JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || this.generateFallbackSecret('refresh');
  static JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '24h';
  static JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

  // Cookie configuration
  static COOKIE_SECRET = process.env.COOKIE_SECRET || 'cookie-secret-key';
  static REFRESH_TOKEN_COOKIE = 'refresh_token';
  static COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  // CORS configuration
  static CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

  // Bcrypt configuration
  static BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

  // Cloudinary configuration
  static CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
  static CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
  static CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

  // Email configuration
  static EMAIL_HOST = process.env.EMAIL_HOST;
  static EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '465');
  static EMAIL_SECURE = process.env.EMAIL_SECURE === 'true';
  static EMAIL_USER = process.env.EMAIL_USER;
  static EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
  static EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Artisan Connect';
  static EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS;

  // Client URL
  static CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

  // Rate limiting
  static RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
  static RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

  // File upload limits
  static MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB
  static ALLOWED_FILE_TYPES = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  /**
   * Validate configuration on startup
   */
  static validate(): void {
    const requiredVars = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

    const missing = requiredVars.filter((varName) => !process.env[varName]);

    if (missing.length > 0) {
      console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
      if (this.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
    }

    // Validate Cloudinary config if cloud storage is needed
    if (!this.CLOUDINARY_CLOUD_NAME || !this.CLOUDINARY_API_KEY || !this.CLOUDINARY_API_SECRET) {
      console.warn('Warning: Cloudinary configuration is incomplete. File uploads may not work.');
    }
  }

  /**
   * Generate fallback secret for development
   */
  private static generateFallbackSecret(type: string): string {
    if (this.NODE_ENV === 'production') {
      throw new Error(`${type.toUpperCase()}_SECRET must be set in production`);
    }
    return `fallback-${type}-secret-${Date.now()}`;
  }

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
    const origins = this.CORS_ORIGIN.split(',').map((origin) => origin.trim());

    return {
      origin: origins.length === 1 ? origins[0] : origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
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

  /**
   * Get rate limiting configuration
   */
  static getRateLimitConfig() {
    return {
      windowMs: this.RATE_LIMIT_WINDOW_MS,
      max: this.RATE_LIMIT_MAX_REQUESTS,
    };
  }

  /**
   * Get file upload configuration
   */
  static getFileUploadConfig() {
    return {
      maxFileSize: this.MAX_FILE_SIZE,
      allowedTypes: this.ALLOWED_FILE_TYPES,
    };
  }

  /**
   * Check if running in development
   */
  static isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  }

  /**
   * Check if running in production
   */
  static isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }

  /**
   * Check if running in test
   */
  static isTest(): boolean {
    return this.NODE_ENV === 'test';
  }
}
