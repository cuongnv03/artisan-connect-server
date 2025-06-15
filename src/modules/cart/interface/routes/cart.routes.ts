import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { AddToCartController } from '../controllers/AddToCartController';
import { AddNegotiatedItemToCartController } from '../controllers/AddNegotiatedItemToCartController';
import { UpdateCartItemController } from '../controllers/UpdateCartItemController';
import { RemoveFromCartController } from '../controllers/RemoveFromCartController';
import { ClearCartController } from '../controllers/ClearCartController';
import { GetCartController } from '../controllers/GetCartController';
import { GetCartSummaryController } from '../controllers/GetCartSummaryController';
import { GetCartCountController } from '../controllers/GetCartCountController';
import { ValidateCartController } from '../controllers/ValidateCartController';

// Validators
import {
  addToCartSchema,
  addNegotiatedItemToCartSchema,
  updateCartItemSchema,
  validateCartQuerySchema,
  getCartQuerySchema,
} from '../validators/cart.validator';

const router = Router();

// Initialize controllers
const addToCartController = new AddToCartController();
const addNegotiatedItemToCartController = new AddNegotiatedItemToCartController();
const updateCartItemController = new UpdateCartItemController();
const removeFromCartController = new RemoveFromCartController();
const clearCartController = new ClearCartController();
const getCartController = new GetCartController();
const getCartSummaryController = new GetCartSummaryController();
const getCartCountController = new GetCartCountController();
const validateCartController = new ValidateCartController();

// All routes require authentication
router.use(authenticate);

// === CORE CART OPERATIONS ===
// Get cart
router.get('/', validate(getCartQuerySchema, 'query'), getCartController.execute);

// Get cart summary
router.get('/summary', getCartSummaryController.execute);

// Get cart item count
router.get('/count', getCartCountController.execute);

// Add item to cart
router.post('/', validate(addToCartSchema), addToCartController.execute);

// Add negotiated item to cart
router.post(
  '/negotiated/:negotiationId',
  validateIdParam('negotiationId'),
  validate(addNegotiatedItemToCartSchema),
  addNegotiatedItemToCartController.execute,
);

// Update cart item
router.patch(
  '/:productId',
  validateIdParam('productId'),
  validate(updateCartItemSchema),
  updateCartItemController.execute,
);

// Remove item from cart
router.delete('/:productId', validateIdParam('productId'), removeFromCartController.execute);

// Clear entire cart
router.delete('/', clearCartController.execute);

// === CART VALIDATION ===
// Validate cart
router.get('/validate', validate(validateCartQuerySchema, 'query'), validateCartController.execute);

export default router;
