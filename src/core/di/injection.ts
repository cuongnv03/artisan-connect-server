import container from './container';
import { Config } from '../../config/config';
import { JwtService } from '../infrastructure/security/JwtService';
import { BcryptService } from '../infrastructure/security/BcryptService';
import { PrismaClientManager } from '../database/PrismaClient';
import { CloudinaryService } from '../infrastructure/storage/CloudinaryService';

// Prisma client
const prisma = PrismaClientManager.getClient();
container.register('prismaClient', prisma);

// Security services
container.register('jwtService', new JwtService(Config.getJwtConfig()));
container.register('bcryptService', new BcryptService(Config.BCRYPT_SALT_ROUNDS));

// Storage services
container.register('cloudinaryService', new CloudinaryService(Config.getCloudinaryConfig()));

// Import repositories
import { UserRepository } from '../../modules/auth/repositories/UserRepository';
import { RefreshTokenRepository } from '../../modules/auth/repositories/RefreshTokenRepository';
import { PasswordResetRepository } from '../../modules/auth/repositories/PasswordResetRepository';
import { EmailVerificationRepository } from '../../modules/auth/repositories/EmailVerificationRepository';

import { ProfileRepository } from '../../modules/user/repositories/ProfileRepository';
import { AddressRepository } from '../../modules/user/repositories/AddressRepository';
import { FollowRepository } from '../../modules/user/repositories/FollowRepository';
import { UserActivityRepository } from '../../modules/user/repositories/UserActivityRepository';

import { ArtisanProfileRepository } from '../../modules/artisan/repositories/ArtisanProfileRepository';
import { UpgradeRequestRepository } from '../../modules/artisan/repositories/UpgradeRequestRepository';

import { PostRepository } from '../../modules/post/repositories/PostRepository';

import { LikeRepository } from '../../modules/social/repositories/LikeRepository';
import { CommentRepository } from '../../modules/social/repositories/CommentRepository';
import { SavedPostRepository } from '../../modules/social/repositories/SavedPostRepository';

import { ProductRepository } from '../../modules/product/repositories/ProductRepository';
import { CategoryRepository } from '../../modules/product/repositories/CategoryRepository';

import { QuoteRepository } from '../../modules/quote/repositories/QuoteRepository';
import { OrderRepository } from '../../modules/order/repositories/OrderRepository';
import { CartRepository } from '../../modules/cart/repositories/CartRepository';
import { ReviewRepository } from '../../modules/review/repositories/ReviewRepository';
import { PostAnalyticsRepository } from '../../modules/analytics/repositories/PostAnalyticsRepository';

// Register repositories
container.register('userRepository', new UserRepository(prisma));
container.register('refreshTokenRepository', new RefreshTokenRepository(prisma));
container.register('passwordResetRepository', new PasswordResetRepository(prisma));
container.register('emailVerificationRepository', new EmailVerificationRepository(prisma));

container.register('profileRepository', new ProfileRepository(prisma));
container.register('addressRepository', new AddressRepository(prisma));
container.register('followRepository', new FollowRepository(prisma));
container.register('userActivityRepository', new UserActivityRepository(prisma));

container.register('artisanProfileRepository', new ArtisanProfileRepository(prisma));
container.register('upgradeRequestRepository', new UpgradeRequestRepository(prisma));

container.register('postRepository', new PostRepository(prisma));

container.register('likeRepository', new LikeRepository(prisma));
container.register('commentRepository', new CommentRepository(prisma));
container.register('savedPostRepository', new SavedPostRepository(prisma));

container.register('productRepository', new ProductRepository(prisma));
container.register('categoryRepository', new CategoryRepository(prisma));

container.register('cartRepository', new CartRepository(prisma));
container.register('quoteRepository', new QuoteRepository(prisma));
container.register('orderRepository', new OrderRepository(prisma));
container.register('reviewRepository', new ReviewRepository(prisma));
container.register('postAnalyticsRepository', new PostAnalyticsRepository(prisma));

// Import services
import { AuthService } from '../../modules/auth/services/AuthService';

import { UserService } from '../../modules/user/services/UserService';

import { ArtisanProfileService } from '../../modules/artisan/services/ArtisanProfileService';

import { PostService } from '../../modules/post/services/PostService';

import { LikeService } from '../../modules/social/services/LikeService';
import { CommentService } from '../../modules/social/services/CommentService';
import { SavedPostService } from '../../modules/social/services/SavedPostService';

import { ProductService } from '../../modules/product/services/ProductService';
import { CategoryService } from '../../modules/product/services/CategoryService';

import { QuoteService } from '../../modules/quote/services/QuoteService';
import { OrderService } from '../../modules/order/services/OrderService';
import { CartService } from '../../modules/cart/services/CartService';
import { ReviewService } from '../../modules/review/services/ReviewService';
import { PostAnalyticsService } from '../../modules/analytics/services/PostAnalyticsService';

// Register services
container.register('authService', new AuthService());

container.register('userService', new UserService());

container.register('artisanProfileService', new ArtisanProfileService());

container.register('postService', new PostService());

container.register('likeService', new LikeService());
container.register('commentService', new CommentService());
container.register('savedPostService', new SavedPostService());

container.register('productService', new ProductService());
container.register('categoryService', new CategoryService());

container.register('cartService', new CartService());
container.register('quoteService', new QuoteService());
container.register('orderService', new OrderService());
container.register('reviewService', new ReviewService());
container.register('postAnalyticsService', new PostAnalyticsService());

console.log('Dependency injection initialized');
