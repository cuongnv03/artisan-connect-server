import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';

// Controllers
import { AddToCartController } from '../controllers/cart/AddToCartController';
import { GetCartController } from '../controllers/cart/GetCartController';
import { UpdateCartItemController } from '../controllers/cart/UpdateCartItemController';
import { RemoveFromCartController } from '../controllers/cart/RemoveFromCartController';
import { ClearCartController } from '../controllers/cart/ClearCartController';
import { ValidateCartController } from '../controllers/cart/ValidateCartController';

// Validators
import { addToCartSchema, updateCartItemSchema } from '../validators/cart.validator';

const router = Router();

// Initialize controllers
const addToCartController = new AddToCartController();
const getCartController = new GetCartController();
const updateCartItemController = new UpdateCartItemController();
const removeFromCartController = new RemoveFromCartController();
const clearCartController = new ClearCartController();
const validateCartController = new ValidateCartController();

// All routes require authentication
router.use(authenticate);

// Cart routes
router.post('/', validate(addToCartSchema), addToCartController.execute);
router.get('/', getCartController.execute);
router.patch('/:productId', validate(updateCartItemSchema), updateCartItemController.execute);
router.delete('/:productId', removeFromCartController.execute);
router.delete('/', clearCartController.execute);
router.get('/validate', validateCartController.execute);

export default router;
