import { Express } from 'express';
import { Config } from '../../../config/config';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import artisanProfileRoutes from './artisanProfile.routes';
import socialRoutes from './social.routes';
import contentRoutes from './content.routes';
import notificationRoutes from './notification.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import quoteRoutes from './quote.routes';
import orderRoutes from './order.routes';
import cartRoutes from './cart.routes';
import reviewRoutes from './review.routes';

export const registerRoutes = (app: Express): void => {
  const apiPrefix = Config.API_PREFIX;

  // Mount routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/artisan-profiles`, artisanProfileRoutes);
  app.use(`${apiPrefix}/social`, socialRoutes);
  app.use(`${apiPrefix}/content`, contentRoutes);
  app.use(`${apiPrefix}/notifications`, notificationRoutes);
  app.use(`${apiPrefix}/products`, productRoutes);
  app.use(`${apiPrefix}/categories`, categoryRoutes);
  app.use(`${apiPrefix}/quotes`, quoteRoutes);
  app.use(`${apiPrefix}/orders`, orderRoutes);
  app.use(`${apiPrefix}/cart`, cartRoutes);
  app.use(`${apiPrefix}/reviews`, reviewRoutes);

  // Add more routes here as they are implemented
};
