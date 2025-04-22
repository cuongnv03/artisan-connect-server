import { Express } from 'express';
import { Config } from '../../../config/config';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import artisanProfileRoutes from './artisanProfile.routes';

export const registerRoutes = (app: Express): void => {
  const apiPrefix = Config.API_PREFIX;

  // Mount routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/artisan-profiles`, artisanProfileRoutes);

  // Add more routes here as they are implemented
};
