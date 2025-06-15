import { Express } from 'express';
import { Config } from './config/config';
import { Logger } from './core/logging/Logger';

// Import router modules
import authRoutes from './modules/auth/interface/routes/auth.routes';
import userRoutes from './modules/user/interface/routes/user.routes';
import artisanRoutes from './modules/artisan/interface/routes/artisan.routes';
import postRoutes from './modules/post/interface/routes/post.routes';
import socialRoutes from './modules/social/interface/routes/social.routes';
import analyticsRoutes from './modules/analytics/interface/routes/analytics.routes';
import productRoutes from './modules/product/interface/routes/product.routes';
import categoryRoutes from './modules/product/interface/routes/category.routes';
import cartRoutes from './modules/cart/interface/routes/cart.routes';
import negotiationRoutes from './modules/price-negotiation/interface/routes/negotiation.routes';
import customOrderRoutes from './modules/custom-order/interface/routes/custom-order.routes';
import orderRoutes from './modules/order/interface/routes/order.routes';
import reviewRoutes from './modules/review/interface/routes/review.routes';
import notificationRoutes from './modules/notification/interface/routes/notification.routes';
import messageRoutes from './modules/messaging/interface/routes/message.routes';
import uploadRoutes from './modules/upload/interface/routes/upload.routes';

const logger = Logger.getInstance();
const apiPrefix = Config.API_PREFIX;

export const registerRoutes = (app: Express) => {
  try {
    // API routes với prefix
    app.use(`${apiPrefix}/auth`, authRoutes);
    app.use(`${apiPrefix}/users`, userRoutes);
    app.use(`${apiPrefix}/artisans`, artisanRoutes);

    app.use(`${apiPrefix}/posts`, postRoutes);
    app.use(`${apiPrefix}/social`, socialRoutes);
    app.use(`${apiPrefix}/analytics`, analyticsRoutes);

    app.use(`${apiPrefix}/products`, productRoutes);
    app.use(`${apiPrefix}/categories`, categoryRoutes);
    app.use(`${apiPrefix}/negotiations`, negotiationRoutes);
    app.use(`${apiPrefix}/cart`, cartRoutes);
    app.use(`${apiPrefix}/customs`, customOrderRoutes);
    app.use(`${apiPrefix}/orders`, orderRoutes);
    app.use(`${apiPrefix}/reviews`, reviewRoutes);

    app.use(`${apiPrefix}/notifications`, notificationRoutes);
    app.use(`${apiPrefix}/messages`, messageRoutes);

    app.use(`${apiPrefix}/upload`, uploadRoutes);
    // Thêm routes khác

    // API documentation route
    app.get(`${apiPrefix}`, (req, res) => {
      res.json({
        name: 'Artisan Connect API',
        version: '1.0.0',
        description: 'Social commerce platform for artisans and handmade products',
        endpoints: {
          auth: `${apiPrefix}/auth`,
          users: `${apiPrefix}/users`,
          artisans: `${apiPrefix}/artisans`,
          posts: `${apiPrefix}/posts`,
          social: `${apiPrefix}/social`,
          products: `${apiPrefix}/products`,
          orders: `${apiPrefix}/orders`,
          negotiations: `${apiPrefix}/negotiations`,
          cart: `${apiPrefix}/cart`,
          customs: `${apiPrefix}/customs`,
          reviews: `${apiPrefix}/reviews`,
          analytics: `${apiPrefix}/analytics`,
          notifications: `${apiPrefix}/notifications`,
          messages: `${apiPrefix}/messages`,
        },
        documentation: `${apiPrefix}/docs`,
        socketio: '/socket.io',
      });
    });

    logger.info('Routes registered successfully');
  } catch (error) {
    logger.error(`Error registering routes: ${error}`);
    throw error;
  }
};
