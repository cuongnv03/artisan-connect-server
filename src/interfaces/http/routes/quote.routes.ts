import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';

// Controllers
import { CreateQuoteRequestController } from '../controllers/quote/CreateQuoteRequestController';
import { GetQuoteRequestController } from '../controllers/quote/GetQuoteRequestController';
import { GetMyQuoteRequestsController } from '../controllers/quote/GetMyQuoteRequestsController';
import { RespondToQuoteController } from '../controllers/quote/RespondToQuoteController';
import { AddQuoteMessageController } from '../controllers/quote/AddQuoteMessageController';
import { ConvertToOrderController } from '../controllers/quote/ConvertToOrderController';
import { CancelQuoteController } from '../controllers/quote/CancelQuoteController';

// Validators
import {
  createQuoteRequestSchema,
  respondToQuoteSchema,
  addQuoteMessageSchema,
  convertToOrderSchema,
} from '../validators/quote.validator';

const router = Router();

// Initialize controllers
const createQuoteRequestController = new CreateQuoteRequestController();
const getQuoteRequestController = new GetQuoteRequestController();
const getMyQuoteRequestsController = new GetMyQuoteRequestsController();
const respondToQuoteController = new RespondToQuoteController();
const addQuoteMessageController = new AddQuoteMessageController();
const convertToOrderController = new ConvertToOrderController();
const cancelQuoteController = new CancelQuoteController();

// Routes that require authentication
router.post(
  '/',
  authenticate,
  validate(createQuoteRequestSchema),
  createQuoteRequestController.execute,
);

router.get('/my-quotes', authenticate, getMyQuoteRequestsController.execute);

router.get('/:id', authenticate, getQuoteRequestController.execute);

router.post(
  '/:id/respond',
  authenticate,
  validate(respondToQuoteSchema),
  respondToQuoteController.execute,
);

router.post(
  '/:id/messages',
  authenticate,
  validate(addQuoteMessageSchema),
  addQuoteMessageController.execute,
);

router.post(
  '/:id/convert-to-order',
  authenticate,
  validate(convertToOrderSchema),
  convertToOrderController.execute,
);

router.post('/:id/cancel', authenticate, cancelQuoteController.execute);

export default router;
