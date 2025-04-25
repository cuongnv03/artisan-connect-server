import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';

// Controllers
import { CreateReviewController } from '../controllers/CreateReviewController';
import { UpdateReviewController } from '../controllers/UpdateReviewController';
import { DeleteReviewController } from '../controllers/DeleteReviewController';
import { GetReviewController } from '../controllers/GetReviewController';
import { GetReviewsController } from '../controllers/GetReviewsController';
import { GetProductReviewsController } from '../controllers/GetProductReviewsController';
import { GetUserReviewsController } from '../controllers/GetUserReviewsController';
import { GetProductReviewStatisticsController } from '../controllers/GetProductReviewStatisticsController';
import { MarkReviewHelpfulController } from '../controllers/MarkReviewHelpfulController';
import { GetReviewHelpfulStatusController } from '../controllers/GetReviewHelpfulStatusController';
import { GetReviewableProductsController } from '../controllers/GetReviewableProductsController';

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
