import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Core Controllers
import { AddToCartController } from '../controllers/AddToCartController';
import { UpdateCartItemController } from '../controllers/UpdateCartItemController';
import { RemoveFromCartController } from '../controllers/RemoveFromCartController';
import { ClearCartController } from '../controllers/ClearCartController';
import { GetCartController } from '../controllers/GetCartController';
import { GetCartSummaryController } from '../controllers/GetCartSummaryController';

// Validation Controllers
import { ValidateCartController } from '../controllers/ValidateCartController';

// Bulk Operations Controllers
import { BulkUpdateCartController } from '../controllers/BulkUpdateCartController';
import { BulkRemoveFromCartController } from '../controllers/BulkRemoveFromCartController';

// Guest Cart Controllers
import { MergeGuestCartController } from '../controllers/MergeGuestCartController';

// Analytics Controllers
import { GetCartAnalyticsController } from '../controllers/GetCartAnalyticsController';
import { GetCartCountController } from '../controllers/GetCartCountController';

// Save for Later Controllers
import { SaveItemForLaterController } from '../controllers/SaveItemForLaterController';
import { MoveToCartFromSavedController } from '../controllers/MoveToCartFromSavedController';
import { GetSavedItemsController } from '../controllers/GetSavedItemsController';

// Optimization Controllers
import { OptimizeCartController } from '../controllers/OptimizeCartController';
import { CheckPriceChangesController } from '../controllers/CheckPriceChangesController';
import { SyncCartPricesController } from '../controllers/SyncCartPricesController';
import { RefreshCartController } from '../controllers/RefreshCartController';

// Validators
import {
  addToCartSchema,
  updateCartItemSchema,
  bulkUpdateCartSchema,
  bulkRemoveSchema,
  mergeGuestCartSchema,
  moveToCartFromSavedSchema,
  validateCartQuerySchema,
  getCartQuerySchema,
  syncPricesQuerySchema,
  optimizeCartQuerySchema,
  analyticsQuerySchema,
} from '../validators/cart.validator';

const router = Router();

// Initialize controllers
const addToCartController = new AddToCartController();
const updateCartItemController = new UpdateCartItemController();
const removeFromCartController = new RemoveFromCartController();
const clearCartController = new ClearCartController();
const getCartController = new GetCartController();
const getCartSummaryController = new GetCartSummaryController();

const validateCartController = new ValidateCartController();

const bulkUpdateCartController = new BulkUpdateCartController();
const bulkRemoveFromCartController = new BulkRemoveFromCartController();

const mergeGuestCartController = new MergeGuestCartController();

const getCartAnalyticsController = new GetCartAnalyticsController();
const getCartCountController = new GetCartCountController();

const saveItemForLaterController = new SaveItemForLaterController();
const moveToCartFromSavedController = new MoveToCartFromSavedController();
const getSavedItemsController = new GetSavedItemsController();

const optimizeCartController = new OptimizeCartController();
const checkPriceChangesController = new CheckPriceChangesController();
const syncCartPricesController = new SyncCartPricesController();
const refreshCartController = new RefreshCartController();

// All routes require authentication
router.use(authenticate);

// === CORE CART OPERATIONS ===
// Get cart
router.get('/', validate(getCartQuerySchema, 'query'), getCartController.execute);

// Get cart summary (detailed view)
router.get('/summary', getCartSummaryController.execute);

// Add item to cart
router.post('/', validate(addToCartSchema), addToCartController.execute);

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

// === BULK OPERATIONS ===
// Bulk update cart items
router.patch('/bulk', validate(bulkUpdateCartSchema), bulkUpdateCartController.execute);

// Bulk remove items
router.delete('/bulk', validate(bulkRemoveSchema), bulkRemoveFromCartController.execute);

// === GUEST CART OPERATIONS ===
// Merge guest cart
router.post('/merge', validate(mergeGuestCartSchema), mergeGuestCartController.execute);

// === CART ANALYTICS ===
// Get cart analytics
router.get(
  '/analytics',
  validate(analyticsQuerySchema, 'query'),
  getCartAnalyticsController.execute,
);

// Get cart item count
router.get('/count', getCartCountController.execute);

// === SAVE FOR LATER ===
// Save item for later
router.post('/:productId/save', validateIdParam('productId'), saveItemForLaterController.execute);

// Get saved items
router.get('/saved', getSavedItemsController.execute);

// Move item from saved to cart
router.post(
  '/saved/:productId/move',
  validateIdParam('productId'),
  validate(moveToCartFromSavedSchema),
  moveToCartFromSavedController.execute,
);

// === CART OPTIMIZATION ===
// Optimize cart
router.post(
  '/optimize',
  validate(optimizeCartQuerySchema, 'query'),
  optimizeCartController.execute,
);

// Check price changes
router.get('/price-changes', checkPriceChangesController.execute);

// Sync cart prices
router.post(
  '/sync-prices',
  validate(syncPricesQuerySchema, 'query'),
  syncCartPricesController.execute,
);

// Refresh cart data
router.post('/refresh', refreshCartController.execute);

export default router;
