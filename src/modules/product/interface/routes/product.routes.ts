import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';

// Controllers
import { CreateProductController } from '../controllers/product/CreateProductController';
import { UpdateProductController } from '../controllers/product/UpdateProductController';
import { UpdatePriceController } from '../controllers/product/UpdatePriceController';
import { DeleteProductController } from '../controllers/product/DeleteProductController';
import { GetProductController } from '../controllers/product/GetProductController';
import { GetProductsController } from '../controllers/product/GetProductsController';
import { GetPriceHistoryController } from '../controllers/product/GetPriceHistoryController';
import { GetMyProductsController } from '../controllers/product/GetMyProductsController';

// Validators
import {
  createProductSchema,
  updateProductSchema,
  updatePriceSchema,
} from '../validators/product.validator';

const router = Router();

// Initialize controllers
const createProductController = new CreateProductController();
const updateProductController = new UpdateProductController();
const updatePriceController = new UpdatePriceController();
const deleteProductController = new DeleteProductController();
const getProductController = new GetProductController();
const getProductsController = new GetProductsController();
const getPriceHistoryController = new GetPriceHistoryController();
const getMyProductsController = new GetMyProductsController();

// Public routes
router.get('/', getProductsController.execute);
router.get('/:id', getProductController.execute);
router.get('/:id/price-history', getPriceHistoryController.execute);

// Protected routes - require authentication
router.get('/my/products', authenticate, getMyProductsController.execute);

// Protected routes - require artisan role
router.post('/', authenticate, validate(createProductSchema), createProductController.execute);

router.patch('/:id', authenticate, validate(updateProductSchema), updateProductController.execute);

router.patch(
  '/:id/price',
  authenticate,
  validate(updatePriceSchema),
  updatePriceController.execute,
);

router.delete('/:id', authenticate, deleteProductController.execute);

export default router;
