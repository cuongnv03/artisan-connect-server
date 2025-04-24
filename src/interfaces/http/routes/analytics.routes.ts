import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';

// Controllers
import { GetPostAnalyticsController } from '../controllers/analytics/GetPostAnalyticsController';
import { GetPostInsightsController } from '../controllers/analytics/GetPostInsightsController';
import { TrackViewEventController } from '../controllers/analytics/TrackViewEventController';
import { TrackConversionEventController } from '../controllers/analytics/TrackConversionEventController';
import { GetTrendingPostsController } from '../controllers/analytics/GetTrendingPostsController';

// Validators
import {
  trackViewEventSchema,
  trackConversionEventSchema,
  getInsightsQuerySchema,
  getTrendingPostsQuerySchema,
} from '../validators/analytics.validator';

const router = Router();

// Initialize controllers
const getPostAnalyticsController = new GetPostAnalyticsController();
const getPostInsightsController = new GetPostInsightsController();
const trackViewEventController = new TrackViewEventController();
const trackConversionEventController = new TrackConversionEventController();
const getTrendingPostsController = new GetTrendingPostsController();

// Public routes
router.get(
  '/trending',
  validate(getTrendingPostsQuerySchema, 'query'),
  getTrendingPostsController.execute,
);

// Tracking routes (public but may have authenticated user)
router.post('/track/view', validate(trackViewEventSchema), trackViewEventController.execute);

router.post(
  '/track/conversion',
  validate(trackConversionEventSchema),
  trackConversionEventController.execute,
);

// Protected routes - require authentication
router.get('/posts/:postId', authenticate, getPostAnalyticsController.execute);

router.get(
  '/posts/:postId/insights',
  authenticate,
  validate(getInsightsQuerySchema, 'query'),
  getPostInsightsController.execute,
);

export default router;
