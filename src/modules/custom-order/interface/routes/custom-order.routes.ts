import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { CreateCustomOrderController } from '../controllers/CreateCustomOrderController';
import { UpdateCustomOrderController } from '../controllers/UpdateCustomOrderController';
import { RespondToCustomOrderController } from '../controllers/RespondToCustomOrderController';
import { GetCustomOrderController } from '../controllers/GetCustomOrderController';
import { GetMyCustomOrdersController } from '../controllers/GetMyCustomOrdersController';
import { GetNegotiationHistoryController } from '../controllers/GetNegotiationHistoryController';
import { AcceptCounterOfferController } from '../controllers/AcceptCounterOfferController';
import { CancelCustomOrderController } from '../controllers/CancelCustomOrderController';
import { GetCustomOrderStatsController } from '../controllers/GetCustomOrderStatsController';

// Validators
import {
  createCustomOrderSchema,
  updateCustomOrderSchema,
  artisanResponseSchema,
  cancelCustomOrderSchema,
  getCustomOrdersQuerySchema,
  getStatsQuerySchema,
} from '../validators/custom-order.validator';

const router = Router();

// Initialize controllers
const createCustomOrderController = new CreateCustomOrderController();
const updateCustomOrderController = new UpdateCustomOrderController();
const respondToCustomOrderController = new RespondToCustomOrderController();
const getCustomOrderController = new GetCustomOrderController();
const getMyCustomOrdersController = new GetMyCustomOrdersController();
const getNegotiationHistoryController = new GetNegotiationHistoryController();
const acceptCounterOfferController = new AcceptCounterOfferController();
const cancelCustomOrderController = new CancelCustomOrderController();
const getCustomOrderStatsController = new GetCustomOrderStatsController();

// All routes require authentication
router.use(authenticate);

// === CUSTOM ORDER CREATION & MANAGEMENT ===
// Create new custom order (customer only)
router.post('/', validate(createCustomOrderSchema), createCustomOrderController.execute);

// Get my custom orders (role-based: customer requests or artisan received orders)
router.get(
  '/my-orders',
  validate(getCustomOrdersQuerySchema, 'query'),
  getMyCustomOrdersController.execute,
);

// Get custom order statistics
router.get('/stats', validate(getStatsQuerySchema, 'query'), getCustomOrderStatsController.execute);

// Get specific custom order
router.get('/:id', validateIdParam(), getCustomOrderController.execute);

// Update custom order (customer only, pending status only)
router.patch(
  '/:id',
  validateIdParam(),
  validate(updateCustomOrderSchema),
  updateCustomOrderController.execute,
);

// === ARTISAN RESPONSES ===
// Respond to custom order (artisan only)
router.post(
  '/:id/respond',
  validateIdParam(),
  validate(artisanResponseSchema),
  respondToCustomOrderController.execute,
);

// Get negotiation history
router.get('/:id/history', validateIdParam(), getNegotiationHistoryController.execute);

router.post('/:id/accept-counter', validateIdParam(), acceptCounterOfferController.execute);

// === ORDER CANCELLATION ===
// Cancel custom order
router.post(
  '/:id/cancel',
  validateIdParam(),
  validate(cancelCustomOrderSchema),
  cancelCustomOrderController.execute,
);

export default router;
