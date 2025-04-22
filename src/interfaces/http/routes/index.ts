import { Express } from 'express';
import { Config } from '../../../config/config';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

export const registerRoutes = (app: Express): void => {
  const apiPrefix = Config.API_PREFIX;

  // Mount routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);

  // Add more routes here as they are implemented
};
