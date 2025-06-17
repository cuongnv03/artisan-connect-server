import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { CreateNegotiationController } from '../controllers/CreateNegotiationController';
import { RespondToNegotiationController } from '../controllers/RespondToNegotiationController';
import { GetNegotiationController } from '../controllers/GetNegotiationController';
import { GetMyNegotiationsController } from '../controllers/GetMyNegotiationsController';
import { CancelNegotiationController } from '../controllers/CancelNegotiationController';
import { GetNegotiationStatsController } from '../controllers/GetNegotiationStatsController';
import { CheckExistingNegotiationController } from '../controllers/CheckExistingNegotiationController';

// Validators
import {
  createNegotiationSchema,
  respondToNegotiationSchema,
  cancelNegotiationSchema,
  getNegotiationsQuerySchema,
  getNegotiationStatsQuerySchema,
  checkExistingNegotiationParamsSchema,
} from '../validators/negotiation.validator';

const router = Router();

// Initialize controllers
const createNegotiationController = new CreateNegotiationController();
const respondToNegotiationController = new RespondToNegotiationController();
const getNegotiationController = new GetNegotiationController();
const getMyNegotiationsController = new GetMyNegotiationsController();
const cancelNegotiationController = new CancelNegotiationController();
const getNegotiationStatsController = new GetNegotiationStatsController();
const checkExistingNegotiationController = new CheckExistingNegotiationController();

// All routes require authentication
router.use(authenticate);

// === PRICE NEGOTIATION CREATION & MANAGEMENT ===
// Create new price negotiation
router.post('/', validate(createNegotiationSchema), createNegotiationController.execute);

// Get my price negotiations (customer negotiations or artisan received negotiations)
router.get(
  '/my-negotiations',
  validate(getNegotiationsQuerySchema, 'query'),
  getMyNegotiationsController.execute,
);

// Get price negotiation statistics
router.get(
  '/stats',
  validate(getNegotiationStatsQuerySchema, 'query'),
  getNegotiationStatsController.execute,
);

// Get specific price negotiation
router.get('/:id', validateIdParam(), getNegotiationController.execute);

// === PRICE NEGOTIATION RESPONSES ===
// Respond to price negotiation (artisan only)
router.post(
  '/:id/respond',
  validateIdParam(),
  validate(respondToNegotiationSchema),
  respondToNegotiationController.execute,
);

// === PRICE NEGOTIATION CANCELLATION ===
// Cancel price negotiation
router.post(
  '/:id/cancel',
  validateIdParam(),
  validate(cancelNegotiationSchema),
  cancelNegotiationController.execute,
);

router.get(
  '/check/:productId',
  validateIdParam('productId'),
  validate(checkExistingNegotiationParamsSchema, 'params'),
  checkExistingNegotiationController.execute,
);

export default router;
