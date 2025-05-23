import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { CreateQuoteRequestController } from '../controllers/CreateQuoteRequestController';
import { RespondToQuoteController } from '../controllers/RespondToQuoteController';
import { GetQuoteRequestController } from '../controllers/GetQuoteRequestController';
import { GetMyQuoteRequestsController } from '../controllers/GetMyQuoteRequestsController';
import { AddQuoteMessageController } from '../controllers/AddQuoteMessageController';
import { GetNegotiationHistoryController } from '../controllers/GetNegotiationHistoryController';
import { CancelQuoteController } from '../controllers/CancelQuoteController';
import { GetQuoteStatsController } from '../controllers/GetQuoteStatsController';

// Validators
import {
  createQuoteRequestSchema,
  respondToQuoteSchema,
  addQuoteMessageSchema,
  cancelQuoteSchema,
  getQuoteRequestsQuerySchema,
  getQuoteStatsQuerySchema,
} from '../validators/quote.validator';

const router = Router();

// Initialize controllers
const createQuoteRequestController = new CreateQuoteRequestController();
const respondToQuoteController = new RespondToQuoteController();
const getQuoteRequestController = new GetQuoteRequestController();
const getMyQuoteRequestsController = new GetMyQuoteRequestsController();
const addQuoteMessageController = new AddQuoteMessageController();
const getNegotiationHistoryController = new GetNegotiationHistoryController();
const cancelQuoteController = new CancelQuoteController();
const getQuoteStatsController = new GetQuoteStatsController();

// All routes require authentication
router.use(authenticate);

// === QUOTE CREATION & MANAGEMENT ===
// Create new quote request
router.post('/', validate(createQuoteRequestSchema), createQuoteRequestController.execute);

// Get my quote requests (customer requests or artisan received quotes)
router.get(
  '/my-quotes',
  validate(getQuoteRequestsQuerySchema, 'query'),
  getMyQuoteRequestsController.execute,
);

// Get quote statistics
router.get('/stats', validate(getQuoteStatsQuerySchema, 'query'), getQuoteStatsController.execute);

// Get specific quote request
router.get('/:id', validateIdParam(), getQuoteRequestController.execute);

// === QUOTE RESPONSES & NEGOTIATION ===
// Respond to quote request (artisan only)
router.post(
  '/:id/respond',
  validateIdParam(),
  validate(respondToQuoteSchema),
  respondToQuoteController.execute,
);

// Add message to quote
router.post(
  '/:id/messages',
  validateIdParam(),
  validate(addQuoteMessageSchema),
  addQuoteMessageController.execute,
);

// Get negotiation history
router.get('/:id/history', validateIdParam(), getNegotiationHistoryController.execute);

// === QUOTE CANCELLATION ===
// Cancel quote request
router.post(
  '/:id/cancel',
  validateIdParam(),
  validate(cancelQuoteSchema),
  cancelQuoteController.execute,
);

export default router;
