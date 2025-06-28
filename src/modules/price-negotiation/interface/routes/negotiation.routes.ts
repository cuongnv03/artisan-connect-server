import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { CreateNegotiationController } from '../controllers/CreateNegotiationController';
import { RespondToNegotiationController } from '../controllers/RespondToNegotiationController';
import { GetNegotiationController } from '../controllers/GetNegotiationController';
import { GetMySentNegotiationsController } from '../controllers/GetMySentNegotiationsController';
import { GetMyReceivedNegotiationsController } from '../controllers/GetMyReceivedNegotiationsController';
import { CancelNegotiationController } from '../controllers/CancelNegotiationController';
import { GetMySentNegotiationStatsController } from '../controllers/GetMySentNegotiationStatsController';
import { GetMyReceivedNegotiationStatsController } from '../controllers/GetMyReceivedNegotiationStatsController';
import { CheckExistingNegotiationController } from '../controllers/CheckExistingNegotiationController';

// Validators
import {
  createNegotiationSchema,
  respondToNegotiationSchema,
  cancelNegotiationSchema,
  getNegotiationsQuerySchema,
  getNegotiationStatsQuerySchema,
  checkExistingNegotiationParamsSchema,
  checkExistingNegotiationQuerySchema,
} from '../validators/negotiation.validator';

const router = Router();

// Initialize controllers
const createNegotiationController = new CreateNegotiationController();
const respondToNegotiationController = new RespondToNegotiationController();
const getNegotiationController = new GetNegotiationController();
const getMySentNegotiationsController = new GetMySentNegotiationsController();
const getMyReceivedNegotiationsController = new GetMyReceivedNegotiationsController();
const cancelNegotiationController = new CancelNegotiationController();
const getMySentNegotiationStatsController = new GetMySentNegotiationStatsController();
const getMyReceivedNegotiationStatsController = new GetMyReceivedNegotiationStatsController();
const checkExistingNegotiationController = new CheckExistingNegotiationController();

// All routes require authentication
router.use(authenticate);

// === PRICE NEGOTIATION CREATION & MANAGEMENT ===
// Create new price negotiation
router.post('/', validate(createNegotiationSchema), createNegotiationController.execute);

// Get my sent negotiations (customer view - negotiations I sent)
router.get(
  '/my-sent',
  validate(getNegotiationsQuerySchema, 'query'),
  getMySentNegotiationsController.execute,
);

// Get my received negotiations (artisan view - negotiations I received)
router.get(
  '/my-received',
  validate(getNegotiationsQuerySchema, 'query'),
  getMyReceivedNegotiationsController.execute,
);

// Get price negotiation statistics
router.get(
  '/stats/sent',
  validate(getNegotiationStatsQuerySchema, 'query'),
  getMySentNegotiationStatsController.execute,
);

router.get(
  '/stats/received',
  validate(getNegotiationStatsQuerySchema, 'query'),
  getMyReceivedNegotiationStatsController.execute,
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
  validate(checkExistingNegotiationQuerySchema, 'query'), // NEW
  checkExistingNegotiationController.execute,
);

export default router;
