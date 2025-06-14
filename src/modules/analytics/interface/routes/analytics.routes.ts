import { Router } from 'express';
import { authenticate, authorize } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

import { GetUserAnalyticsController } from '../controllers/GetUserAnalyticsController';
import { GetArtisanDashboardController } from '../controllers/GetArtisanDashboardController';
import { GetPlatformDashboardController } from '../controllers/GetPlatformDashboardController';

const router = Router();

// Initialize controllers
const getUserAnalyticsController = new GetUserAnalyticsController();
const getArtisanDashboardController = new GetArtisanDashboardController();
const getPlatformDashboardController = new GetPlatformDashboardController();

// User analytics (personal stats)
router.get('/user/me', authenticate, getUserAnalyticsController.execute);

// Artisan business dashboard
router.get('/artisan/dashboard', authenticate, getArtisanDashboardController.execute);
router.get(
  '/artisan/:artisanId/dashboard',
  authenticate,
  authorize(['ADMIN']),
  validateIdParam('artisanId'),
  getArtisanDashboardController.execute,
);

// Platform analytics (admin only)
router.get(
  '/platform/dashboard',
  authenticate,
  authorize(['ADMIN']),
  getPlatformDashboardController.execute,
);

export default router;
