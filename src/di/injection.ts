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
import { FollowRepository } from '../infrastructure/database/repositories/FollowRepository';
import { PostRepository } from '../infrastructure/database/repositories/PostRepository';
import { LikeRepository } from '../infrastructure/database/repositories/LikeRepository';
import { CommentRepository } from '../infrastructure/database/repositories/CommentRepository';
import { NotificationRepository } from './../infrastructure/database/repositories/NotificationRepository';
import { NotificationPreferenceRepository } from '../infrastructure/database/repositories/NotificationPreferenceRepository';
import { ProductRepository } from '../infrastructure/database/repositories/ProductRepository';
import { CategoryRepository } from '../infrastructure/database/repositories/CategoryRepository';
import { QuoteRepository } from '../infrastructure/database/repositories/QuoteRepository';
import { OrderRepository } from '../infrastructure/database/repositories/OrderRepository';
import { CartRepository } from '../infrastructure/database/repositories/CartRepository';
import { ReviewRepository } from '../infrastructure/database/repositories/ReviewRepository';
import { PostAnalyticsRepository } from '../infrastructure/database/repositories/PostAnalyticsRepository';

// Register repositories
container.register('userRepository', new UserRepository(prisma));
container.register('refreshTokenRepository', new RefreshTokenRepository(prisma));
container.register('passwordResetRepository', new PasswordResetRepository(prisma));
container.register('emailVerificationRepository', new EmailVerificationRepository(prisma));
container.register('artisanProfileRepository', new ArtisanProfileRepository(prisma));
container.register('upgradeRequestRepository', new UpgradeRequestRepository(prisma));
container.register('followRepository', new FollowRepository(prisma));
container.register('postRepository', new PostRepository(prisma));
container.register('likeRepository', new LikeRepository(prisma));
container.register('commentRepository', new CommentRepository(prisma));
container.register('notificationRepository', new NotificationRepository(prisma));
container.register(
  'notificationPreferenceRepository',
  new NotificationPreferenceRepository(prisma),
);
container.register('productRepository', new ProductRepository(prisma));
container.register('categoryRepository', new CategoryRepository(prisma));
container.register('cartRepository', new CartRepository(prisma));
container.register('quoteRepository', new QuoteRepository(prisma));
container.register('orderRepository', new OrderRepository(prisma));
container.register('reviewRepository', new ReviewRepository(prisma));
container.register('postAnalyticsRepository', new PostAnalyticsRepository(prisma));

// Import services
import { AuthService } from '../application/services/auth/AuthService';
import { UserService } from '../application/services/user/UserService';
import { ArtisanProfileService } from '../application/services/artisanProfile/ArtisanProfileService';
import { FollowService } from '../application/services/social/FollowService';
import { PostService } from '../application/services/content/PostService';
import { LikeService } from '../application/services/social/LikeService';
import { CommentService } from '../application/services/social/CommentService';
import { NotificationService } from '../application/services/notification/NotificationService';
import { ProductService } from '../application/services/product/ProductService';
import { CategoryService } from '../application/services/product/CategoryService';
import { QuoteService } from '../application/services/quote/QuoteService';
import { OrderService } from '../application/services/order/OrderService';
import { CartService } from '../application/services/cart/CartService';
import { ReviewService } from '../application/services/review/ReviewService';
import { PostAnalyticsService } from '../application/services/analytics/PostAnalyticsService';

// Register services
container.register('notificationService', new NotificationService());
container.register('authService', new AuthService());
container.register('userService', new UserService());
container.register('artisanProfileService', new ArtisanProfileService());
container.register('followService', new FollowService());
container.register('postService', new PostService());
container.register('likeService', new LikeService());
container.register('commentService', new CommentService());
container.register('productService', new ProductService());
container.register('categoryService', new CategoryService());
container.register('cartService', new CartService());
container.register('quoteService', new QuoteService());
container.register('orderService', new OrderService());
container.register('reviewService', new ReviewService());
container.register('postAnalyticsService', new PostAnalyticsService());

console.log('Dependency injection initialized');
