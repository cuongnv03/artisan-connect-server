import container from './container';
import { Config } from '../config/config';
import { JwtService } from '../infrastructure/security/JwtService';
import { BcryptService } from '../infrastructure/security/BcryptService';
import { PrismaClientManager } from '../infrastructure/database/prisma/PrismaClient';
import { CloudinaryService } from '../infrastructure/storage/CloudinaryService';
import { EmailService } from '../infrastructure/email/EmailService';
import { AITemplateService } from '../infrastructure/ai/AITemplateService';

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

// Register AI service
container.register('aiTemplateService', new AITemplateService());

// Import repositories
import { UserRepository } from '../infrastructure/database/repositories/UserRepository';
import { RefreshTokenRepository } from '../infrastructure/database/repositories/RefreshTokenRepository';
import { PasswordResetRepository } from '../infrastructure/database/repositories/PasswordResetRepository';
import { EmailVerificationRepository } from '../infrastructure/database/repositories/EmailVerificationRepository';
import { ArtisanProfileRepository } from '../infrastructure/database/repositories/ArtisanProfileRepository';
import { UpgradeRequestRepository } from '../infrastructure/database/repositories/UpgradeRequestRepository';
import { ProductRepository } from '../infrastructure/database/repositories/ProductRepository';
import { CategoryRepository } from '../infrastructure/database/repositories/CategoryRepository';

// Register repositories
container.register('userRepository', new UserRepository(prisma));
container.register('refreshTokenRepository', new RefreshTokenRepository(prisma));
container.register('passwordResetRepository', new PasswordResetRepository(prisma));
container.register('emailVerificationRepository', new EmailVerificationRepository(prisma));
container.register('artisanProfileRepository', new ArtisanProfileRepository(prisma));
container.register('upgradeRequestRepository', new UpgradeRequestRepository(prisma));
container.register('productRepository', new ProductRepository(prisma));
container.register('categoryRepository', new CategoryRepository(prisma));

// Import services
import { AuthService } from '../application/services/auth/AuthService';
import { UserService } from '../application/services/user/UserService';
import { ArtisanProfileService } from '../application/services/artisanProfile/ArtisanProfileService';
import { ProductService } from '../application/services/product/ProductService';
import { CategoryService } from '../application/services/product/CategoryService';

// Register services
container.register('authService', new AuthService());
container.register('userService', new UserService());
container.register('artisanProfileService', new ArtisanProfileService());
container.register('productService', new ProductService());
container.register('categoryService', new CategoryService());

console.log('Dependency injection initialized');
