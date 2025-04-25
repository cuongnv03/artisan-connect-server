import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';

// Controllers
import { AddToCartController } from '../controllers/AddToCartController';
import { GetCartController } from '../controllers/GetCartController';
import { UpdateCartItemController } from '../controllers/UpdateCartItemController';
import { RemoveFromCartController } from '../controllers/RemoveFromCartController';
import { ClearCartController } from '../controllers/ClearCartController';
import { ValidateCartController } from '../controllers/ValidateCartController';

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
