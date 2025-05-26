import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { CreateReviewController } from '../controllers/CreateReviewController';
import { UpdateReviewController } from '../controllers/UpdateReviewController';
import { DeleteReviewController } from '../controllers/DeleteReviewController';
import { GetReviewController } from '../controllers/GetReviewController';
import { GetReviewsController } from '../controllers/GetReviewsController';
import { GetProductReviewsController } from '../controllers/GetProductReviewsController';
import { GetUserReviewsController } from '../controllers/GetUserReviewsController';
import { GetProductReviewStatisticsController } from '../controllers/GetProductReviewStatisticsController';
import { GetReviewableProductsController } from '../controllers/GetReviewableProductsController';
import { GetUserProductReviewController } from '../controllers/GetUserProductReviewController';

// Validators
import {
  createReviewSchema,
  updateReviewSchema,
  getReviewsSchema,
} from '../validators/review.validator';

const router = Router();

// Initialize controllers
const createReviewController = new CreateReviewController();
const updateReviewController = new UpdateReviewController();
const deleteReviewController = new DeleteReviewController();
const getReviewController = new GetReviewController();
const getReviewsController = new GetReviewsController();
const getProductReviewsController = new GetProductReviewsController();
const getUserReviewsController = new GetUserReviewsController();
const getProductReviewStatisticsController = new GetProductReviewStatisticsController();
const getReviewableProductsController = new GetReviewableProductsController();
const getUserProductReviewController = new GetUserProductReviewController();

// === PUBLIC ROUTES ===

// Get reviews with filtering
router.get('/', validate(getReviewsSchema, 'query'), getReviewsController.execute);

// Get product reviews (Remove validateIdParam - accept both UUID and slug)
router.get('/product/:productId', getProductReviewsController.execute);

// Get product review statistics (Remove validateIdParam - accept both UUID and slug)
router.get('/product/:productId/statistics', getProductReviewStatisticsController.execute);

// === AUTHENTICATED ROUTES ===
router.use(authenticate);

// Get user's review for a specific product
router.get(
  '/user-product/:productId',
  validateIdParam('productId'),
  getUserProductReviewController.execute,
);

// Get user's reviews
router.get('/user/me', getUserReviewsController.execute);

// Get reviewable products
router.get('/user/reviewable-products', getReviewableProductsController.execute);

// Create review
router.post('/', validate(createReviewSchema), createReviewController.execute);

// Update review
router.patch(
  '/:id',
  validateIdParam(),
  validate(updateReviewSchema),
  updateReviewController.execute,
);

// Delete review
router.delete('/:id', validateIdParam(), deleteReviewController.execute);

// Get review by ID
router.get('/:id', validateIdParam(), getReviewController.execute);

export default router;
