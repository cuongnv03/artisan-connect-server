import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { CreateOrderFromCartController } from '../controllers/CreateOrderFromCartController';
import { CreateOrderFromQuoteController } from '../controllers/CreateOrderFromQuoteController';
import { GetOrderController } from '../controllers/GetOrderController';
import { GetOrderByNumberController } from '../controllers/GetOrderByNumberController';
import { GetMyOrdersController } from '../controllers/GetMyOrdersController';
import { GetSellerOrdersController } from '../controllers/GetSellerOrdersController';
import { UpdateOrderStatusController } from '../controllers/UpdateOrderStatusController';
import { CancelOrderController } from '../controllers/CancelOrderController';
import { ProcessPaymentController } from '../controllers/ProcessPaymentController';
import { GetOrderStatusHistoryController } from '../controllers/GetOrderStatusHistoryController';
import { GetOrderStatsController } from '../controllers/GetOrderStatsController';

// Validators
import {
  createOrderFromCartSchema,
  createOrderFromQuoteSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  processPaymentSchema,
  getOrdersQuerySchema,
  getOrderStatsQuerySchema,
} from '../validators/order.validator';

const router = Router();

// Initialize controllers
const createOrderFromCartController = new CreateOrderFromCartController();
const createOrderFromQuoteController = new CreateOrderFromQuoteController();
const getOrderController = new GetOrderController();
const getOrderByNumberController = new GetOrderByNumberController();
const getMyOrdersController = new GetMyOrdersController();
const getSellerOrdersController = new GetSellerOrdersController();
const updateOrderStatusController = new UpdateOrderStatusController();
const cancelOrderController = new CancelOrderController();
const processPaymentController = new ProcessPaymentController();
const getOrderStatusHistoryController = new GetOrderStatusHistoryController();
const getOrderStatsController = new GetOrderStatsController();

// All routes require authentication
router.use(authenticate);

// === ORDER CREATION ===
router.post(
  '/from-cart',
  validate(createOrderFromCartSchema),
  createOrderFromCartController.execute,
);

router.post(
  '/from-quote',
  validate(createOrderFromQuoteSchema),
  createOrderFromQuoteController.execute,
);

// === ORDER RETRIEVAL ===
router.get('/my-orders', validate(getOrdersQuerySchema, 'query'), getMyOrdersController.execute);

router.get(
  '/seller-orders',
  validate(getOrdersQuerySchema, 'query'),
  getSellerOrdersController.execute,
);

router.get('/stats', validate(getOrderStatsQuerySchema, 'query'), getOrderStatsController.execute);

router.get('/number/:orderNumber', getOrderByNumberController.execute);

router.get('/:id', validateIdParam(), getOrderController.execute);

router.get('/:id/history', validateIdParam(), getOrderStatusHistoryController.execute);

// === ORDER MANAGEMENT ===
router.patch(
  '/:id/status',
  validateIdParam(),
  validate(updateOrderStatusSchema),
  updateOrderStatusController.execute,
);

router.post(
  '/:id/cancel',
  validateIdParam(),
  validate(cancelOrderSchema),
  cancelOrderController.execute,
);

router.post(
  '/:id/payment',
  validateIdParam(),
  validate(processPaymentSchema),
  processPaymentController.execute,
);

export default router;
