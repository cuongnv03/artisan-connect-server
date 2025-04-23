import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';

// Controllers
import { CreateReviewController } from '../controllers/review/CreateReviewController';
import { UpdateReviewController } from '../controllers/review/UpdateReviewController';
import { DeleteReviewController } from '../controllers/review/DeleteReviewController';
import { GetReviewController } from '../controllers/review/GetReviewController';
import { GetReviewsController } from '../controllers/review/GetReviewsController';
import { GetProductReviewsController } from '../controllers/review/GetProductReviewsController';
import { GetUserReviewsController } from '../controllers/review/GetUserReviewsController';
import { GetProductReviewStatisticsController } from '../controllers/review/GetProductReviewStatisticsController';
import { MarkReviewHelpfulController } from '../controllers/review/MarkReviewHelpfulController';
import { GetReviewHelpfulStatusController } from '../controllers/review/GetReviewHelpfulStatusController';
import { GetReviewableProductsController } from '../controllers/review/GetReviewableProductsController';

// Validators
import {
  createReviewSchema,
  updateReviewSchema,
  markReviewHelpfulSchema,
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
const markReviewHelpfulController = new MarkReviewHelpfulController();
const getReviewHelpfulStatusController = new GetReviewHelpfulStatusController();
const getReviewableProductsController = new GetReviewableProductsController();

// Public routes
router.get('/:id', getReviewController.execute);
router.get('/', validate(getReviewsSchema, 'query'), getReviewsController.execute);
router.get('/product/:productId', getProductReviewsController.execute);
router.get('/product/:productId/statistics', getProductReviewStatisticsController.execute);

// Authenticated routes
router.use(authenticate);

router.post('/', validate(createReviewSchema), createReviewController.execute);
router.patch('/:id', validate(updateReviewSchema), updateReviewController.execute);
router.delete('/:id', deleteReviewController.execute);
router.get('/user/me', getUserReviewsController.execute);
router.post('/:id/helpful', validate(markReviewHelpfulSchema), markReviewHelpfulController.execute);
router.get('/:id/helpful', getReviewHelpfulStatusController.execute);
router.get('/user/reviewable-products', getReviewableProductsController.execute);

export default router;
