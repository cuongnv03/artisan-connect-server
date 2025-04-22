import container from './container';
import { Config } from '../config/config';
import { JwtService } from '../infrastructure/security/JwtService';
import { BcryptService } from '../infrastructure/security/BcryptService';
import { PrismaClientManager } from '../infrastructure/database/prisma/PrismaClient';
import { CloudinaryService } from '../infrastructure/storage/CloudinaryService';
import { EmailService } from '../infrastructure/email/EmailService';

// Prisma client
const prisma = PrismaClientManager.getClient();
container.register('prismaClient', prisma);

// Security services
container.register('jwtService', new JwtService(Config.getJwtConfig()));
container.register('bcryptService', new BcryptService(Config.BCRYPT_SALT_ROUNDS));

// Storage services
container.register('cloudinaryService', new CloudinaryService(Config.getCloudinaryConfig()));

// Email service
container.register('emailService', new EmailService());

// Import repositories
import { UserRepository } from '../infrastructure/database/repositories/UserRepository';
import { RefreshTokenRepository } from '../infrastructure/database/repositories/RefreshTokenRepository';
import { PasswordResetRepository } from '../infrastructure/database/repositories/PasswordResetRepository';
import { EmailVerificationRepository } from '../infrastructure/database/repositories/EmailVerificationRepository';

// Register repositories
container.register('userRepository', new UserRepository(prisma));
container.register('refreshTokenRepository', new RefreshTokenRepository(prisma));
container.register('passwordResetRepository', new PasswordResetRepository(prisma));
container.register('emailVerificationRepository', new EmailVerificationRepository(prisma));

// Import services
import { AuthService } from '../application/services/auth/AuthService';
import { UserService } from '../application/services/user/UserService';

// Register services
container.register('authService', new AuthService());
container.register('userService', new UserService());

console.log('Dependency injection initialized');
