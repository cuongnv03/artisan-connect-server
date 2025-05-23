import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { GetPostAnalyticsController } from '../controllers/GetPostAnalyticsController';
import { GetPostInsightsController } from '../controllers/GetPostInsightsController';
import { TrackViewEventController } from '../controllers/TrackViewEventController';
import { TrackConversionEventController } from '../controllers/TrackConversionEventController';
import { GetTrendingPostsController } from '../controllers/GetTrendingPostsController';
import { GetUserAnalyticsSummaryController } from '../controllers/GetUserAnalyticsSummaryController';

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
const getUserAnalyticsSummaryController = new GetUserAnalyticsSummaryController();

// === PUBLIC ROUTES ===
// Get trending posts
router.get(
  '/trending',
  validate(getTrendingPostsQuerySchema, 'query'),
  getTrendingPostsController.execute,
);

// === TRACKING ROUTES (PUBLIC BUT MAY HAVE AUTHENTICATED USER) ===
// Track view event
router.post('/track/view', validate(trackViewEventSchema), trackViewEventController.execute);

// Track conversion event
router.post(
  '/track/conversion',
  validate(trackConversionEventSchema),
  trackConversionEventController.execute,
);

// === PROTECTED ROUTES ===
// Get basic analytics for a post (owner only)
router.get(
  '/posts/:postId',
  authenticate,
  validateIdParam('postId'),
  getPostAnalyticsController.execute,
);

// Get detailed insights for a post (owner only)
router.get(
  '/posts/:postId/insights',
  authenticate,
  validateIdParam('postId'),
  validate(getInsightsQuerySchema, 'query'),
  getPostInsightsController.execute,
);

// Get user's analytics summary
router.get('/summary', authenticate, getUserAnalyticsSummaryController.execute);

export default router;
