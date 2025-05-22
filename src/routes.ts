import { Express } from 'express';
import { Config } from './config/config';
import { Logger } from './core/logging/Logger';

// Import router modules
import authRoutes from './modules/user/interface/routes/auth.routes';
import userRoutes from './modules/user/interface/routes/user.routes';
import systemConfigRoutes from './modules/system/interface/routes/system-config.routes';
import profileRoutes from './modules/profile/interface/routes/profile.routes';
import artisansRoutes from './modules/artisanProfile/interface/routes/artisans.routes';
import artisanProfileRoutes from './modules/artisanProfile/interface/routes/artisanProfile.routes';
import postRoutes from './modules/post/interface/routes/post.routes';
import socialRoutes from './modules/social/interface/routes/social.routes';
import analyticsRoutes from './modules/analytics/interface/routes/analytics.routes';
import productRoutes from './modules/product/interface/routes/product.routes';
import categoryRoutes from './modules/product/interface/routes/category.routes';
import cartRoutes from './modules/cart/interface/routes/cart.routes';
import quoteRoutes from './modules/quote/interface/routes/quote.routes';
import orderRoutes from './modules/order/interface/routes/order.routes';
import reviewRoutes from './modules/review/interface/routes/review.routes';

const logger = Logger.getInstance();
const apiPrefix = Config.API_PREFIX;

export const registerRoutes = (app: Express) => {
  // API routes với prefix
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/config`, systemConfigRoutes);
  app.use(`${apiPrefix}/profiles`, profileRoutes);
  app.use(`${apiPrefix}/artisans`, artisansRoutes);
  app.use(`${apiPrefix}/artisan-profiles`, artisanProfileRoutes);
  app.use(`${apiPrefix}/posts`, postRoutes);
  app.use(`${apiPrefix}/social`, socialRoutes);
  app.use(`${apiPrefix}/saved-posts`, socialRoutes);
  app.use(`${apiPrefix}/analytics`, analyticsRoutes);
  app.use(`${apiPrefix}/products`, productRoutes);
  app.use(`${apiPrefix}/categories`, categoryRoutes);
  app.use(`${apiPrefix}/cart`, cartRoutes);
  app.use(`${apiPrefix}/quotes`, quoteRoutes);
  app.use(`${apiPrefix}/orders`, orderRoutes);
  app.use(`${apiPrefix}/reviews`, reviewRoutes);
  // Thêm routes khác

  logger.info('Routes registered');
};
