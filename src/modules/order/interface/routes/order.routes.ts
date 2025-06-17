import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate, authorize } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { CreateOrderFromCartController } from '../controllers/CreateOrderFromCartController';
import { CreateOrderFromQuoteController } from '../controllers/CreateOrderFromQuoteController';
import { GetOrderController } from '../controllers/GetOrderController';
import { GetOrderByNumberController } from '../controllers/GetOrderByNumberController';
import { GetMyOrdersController } from '../controllers/GetMyOrdersController';
import { GetMyArtisanOrdersController } from '../controllers/GetMyArtisanOrdersController';
import { UpdateOrderStatusController } from '../controllers/UpdateOrderStatusController';
import { CancelOrderController } from '../controllers/CancelOrderController';
import { ProcessPaymentController } from '../controllers/ProcessPaymentController';
import { GetOrderStatsController } from '../controllers/GetOrderStatsController';
import { GetOrderStatusHistoryController } from '../controllers/GetOrderStatusHistoryController';

// // Dispute Controllers
// import { CreateDisputeController } from '../controllers/dispute/CreateDisputeController';
// import { GetMyDisputesController } from '../controllers/dispute/GetMyDisputesController';
// import { UpdateDisputeController } from '../controllers/dispute/UpdateDisputeController';
// import { GetDisputeController } from '../controllers/dispute/GetDisputeController';

// // Return Controllers
// import { CreateReturnController } from '../controllers/return/CreateReturnController';
// import { GetMyReturnsController } from '../controllers/return/GetMyReturnsController';
// import { UpdateReturnController } from '../controllers/return/UpdateReturnController';
// import { GetReturnController } from '../controllers/return/GetReturnController';

// Admin Controllers
import { GetAllDisputesController } from '../controllers/dispute/GetAllDisputesController';
import { GetAllReturnsController } from '../controllers/return/GetAllReturnsController';

// Validators
import {
  createOrderFromCartSchema,
  createOrderFromQuoteSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  processPaymentSchema,
  getOrdersQuerySchema,
  getOrderStatsQuerySchema,
  // createDisputeSchema,
  // updateDisputeSchema,
  // getDisputesQuerySchema,
  // createReturnSchema,
  // updateReturnSchema,
  // getReturnsQuerySchema,
} from '../validators/order.validator';

const router = Router();

// Initialize controllers
const createOrderFromCartController = new CreateOrderFromCartController();
const createOrderFromQuoteController = new CreateOrderFromQuoteController();
const getOrderController = new GetOrderController();
const getOrderByNumberController = new GetOrderByNumberController();
const getMyOrdersController = new GetMyOrdersController();
const getMyArtisanOrdersController = new GetMyArtisanOrdersController();
const updateOrderStatusController = new UpdateOrderStatusController();
const cancelOrderController = new CancelOrderController();
const processPaymentController = new ProcessPaymentController();
const getOrderStatsController = new GetOrderStatsController();
const getOrderStatusHistoryController = new GetOrderStatusHistoryController();

// const createDisputeController = new CreateDisputeController();
// const getMyDisputesController = new GetMyDisputesController();
// const updateDisputeController = new UpdateDisputeController();
// const getDisputeController = new GetDisputeController();

// const createReturnController = new CreateReturnController();
// const getMyReturnsController = new GetMyReturnsController();
// const updateReturnController = new UpdateReturnController();
// const getReturnController = new GetReturnController();

const getAllDisputesController = new GetAllDisputesController();
const getAllReturnsController = new GetAllReturnsController();

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
  '/my-artisan-orders',
  validate(getOrdersQuerySchema, 'query'),
  getMyArtisanOrdersController.execute,
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

// // === DISPUTE ROUTES ===
// router.post('/disputes', validate(createDisputeSchema), createDisputeController.execute);
// router.get(
//   '/disputes/my',
//   validate(getDisputesQuerySchema, 'query'),
//   getMyDisputesController.execute,
// );
// router.get('/disputes/:id', validateIdParam(), getDisputeController.execute);
// router.patch(
//   '/disputes/:id',
//   validateIdParam(),
//   validate(updateDisputeSchema),
//   updateDisputeController.execute,
// );

// // === RETURN ROUTES ===
// router.post('/returns', validate(createReturnSchema), createReturnController.execute);
// router.get('/returns/my', validate(getReturnsQuerySchema, 'query'), getMyReturnsController.execute);
// router.get('/returns/:id', validateIdParam(), getReturnController.execute);
// router.patch(
//   '/returns/:id',
//   validateIdParam(),
//   validate(updateReturnSchema),
//   updateReturnController.execute,
// );

// === ADMIN ROUTES ===
// router.get(
//   '/admin/disputes',
//   authorize(['ADMIN']),
//   validate(getDisputesQuerySchema, 'query'),
//   getAllDisputesController.execute,
// );

// router.get(
//   '/admin/returns',
//   authorize(['ADMIN']),
//   validate(getReturnsQuerySchema, 'query'),
//   getAllReturnsController.execute,
// );

export default router;
