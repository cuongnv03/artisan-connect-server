import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';

// Controllers
import { CreateOrderFromCartController } from '../controllers/CreateOrderFromCartController';
import { CreateOrderFromQuoteController } from '../controllers/CreateOrderFromQuoteController';
import { GetOrderController } from '../controllers/GetOrderController';
import { GetOrderByNumberController } from '../controllers/GetOrderByNumberController';
import { GetMyOrdersController } from '../controllers/GetMyOrdersController';
import { GetMyArtisanOrdersController } from '../controllers/GetMyArtisanOrdersController';
import { UpdateOrderStatusController } from '../controllers/UpdateOrderStatusController';
import { UpdateShippingInfoController } from '../controllers/UpdateShippingInfoController';
import { CancelOrderController } from '../controllers/CancelOrderController';
import { GetOrderStatusHistoryController } from '../controllers/GetOrderStatusHistoryController';

// Validators
import {
  createOrderFromCartSchema,
  createOrderFromQuoteSchema,
  updateOrderStatusSchema,
  updateShippingInfoSchema,
  cancelOrderSchema,
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
const updateShippingInfoController = new UpdateShippingInfoController();
const cancelOrderController = new CancelOrderController();
const getOrderStatusHistoryController = new GetOrderStatusHistoryController();

// All routes require authentication
router.use(authenticate);

// Order creation
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

// Order retrieval
router.get('/my-orders', getMyOrdersController.execute);
router.get('/my-artisan-orders', getMyArtisanOrdersController.execute);
router.get('/number/:orderNumber', getOrderByNumberController.execute);
router.get('/:id', getOrderController.execute);
router.get('/:id/history', getOrderStatusHistoryController.execute);

// Order updates
router.patch('/:id/status', validate(updateOrderStatusSchema), updateOrderStatusController.execute);

router.patch(
  '/:id/shipping',
  validate(updateShippingInfoSchema),
  updateShippingInfoController.execute,
);

router.post('/:id/cancel', validate(cancelOrderSchema), cancelOrderController.execute);

export default router;
