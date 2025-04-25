import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';

// Controllers
import { GetPostAnalyticsController } from '../controllers/GetPostAnalyticsController';
import { GetPostInsightsController } from '../controllers/GetPostInsightsController';
import { TrackViewEventController } from '../controllers/TrackViewEventController';
import { TrackConversionEventController } from '../controllers/TrackConversionEventController';
import { GetTrendingPostsController } from '../controllers/GetTrendingPostsController';

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
