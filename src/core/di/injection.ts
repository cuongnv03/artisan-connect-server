import container from './container';
import { Config } from '../../config/config';
import { JwtService } from '../security/JwtService';
import { BcryptService } from '../security/BcryptService';
import { PrismaClientManager } from '../database/PrismaClient';
import { CloudinaryService } from '../storage/CloudinaryService';
import { EmailService } from '../email/EmailService';
import { AITemplateService } from '../ai/AITemplateService';
import { EventBus } from '../events/EventBus';

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

// Register event bus
container.register('eventBus', EventBus.getInstance());

// Import repositories
import { UserRepository } from '../../modules/user/infrastructure/UserRepository';
import { RefreshTokenRepository } from '../../modules/user/infrastructure/RefreshTokenRepository';
import { PasswordResetRepository } from '../../modules/user/infrastructure/PasswordResetRepository';
import { EmailVerificationRepository } from '../../modules/user/infrastructure/EmailVerificationRepository';
import { ArtisanProfileRepository } from '../../modules/artisanProfile/infrastructure/ArtisanProfileRepository';
import { UpgradeRequestRepository } from '../../modules/artisanProfile/infrastructure/UpgradeRequestRepository';
import { FollowRepository } from '../../modules/social/infrastructure/FollowRepository';
import { SavedPostRepository } from '../../modules/social/infrastructure/SavedPostRepository';
import { PostRepository } from '../../modules/content/infrastructure/PostRepository';
import { LikeRepository } from '../../modules/social/infrastructure/LikeRepository';
import { CommentRepository } from '../../modules/social/infrastructure/CommentRepository';
import { NotificationRepository } from '../../modules/notification/infrastructure/NotificationRepository';
import { NotificationPreferenceRepository } from '../../modules/notification/infrastructure/NotificationPreferenceRepository';
import { ProductRepository } from '../../modules/product/infrastructure/ProductRepository';
import { CategoryRepository } from '../../modules/product/infrastructure/CategoryRepository';
import { QuoteRepository } from '../../modules/quote/infrastructure/QuoteRepository';
import { OrderRepository } from '../../modules/order/infrastructure/OrderRepository';
import { CartRepository } from '../../modules/cart/infrastructure/CartRepository';
import { ReviewRepository } from '../../modules/review/infrastructure/ReviewRepository';
import { PostAnalyticsRepository } from '../../modules/analytics/infrastructure/PostAnalyticsRepository';

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
container.register('savedPostRepository', new SavedPostRepository(prisma));
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
import { AuthService } from '../../modules/user/application/AuthService';
import { UserService } from '../../modules/user/application/UserService';
import { ArtisanProfileService } from '../../modules/artisanProfile/application/ArtisanProfileService';
import { FollowService } from '../../modules/social/application/FollowService';
import { SavedPostService } from '../../modules/social/application/SavedPostService';
import { PostService } from '../../modules/content/application/PostService';
import { LikeService } from '../../modules/social/application/LikeService';
import { CommentService } from '../../modules/social/application/CommentService';
import { NotificationService } from '../../modules/notification/application/NotificationService';
import { ProductService } from '../../modules/product/application/ProductService';
import { CategoryService } from '../../modules/product/application/CategoryService';
import { QuoteService } from '../../modules/quote/application/QuoteService';
import { OrderService } from '../../modules/order/application/OrderService';
import { CartService } from '../../modules/cart/application/CartService';
import { ReviewService } from '../../modules/review/application/ReviewService';
import { PostAnalyticsService } from '../../modules/analytics/application/PostAnalyticsService';

// Register services
container.register('authService', new AuthService());
container.register('userService', new UserService());
container.register('artisanProfileService', new ArtisanProfileService());
container.register('followService', new FollowService());
container.register('savedPostService', new SavedPostService());
container.register('postService', new PostService());
container.register('likeService', new LikeService());
container.register('commentService', new CommentService());
container.register('notificationService', new NotificationService());
container.register('productService', new ProductService());
container.register('categoryService', new CategoryService());
container.register('cartService', new CartService());
container.register('quoteService', new QuoteService());
container.register('orderService', new OrderService());
container.register('reviewService', new ReviewService());
container.register('postAnalyticsService', new PostAnalyticsService());

console.log('Dependency injection initialized');
