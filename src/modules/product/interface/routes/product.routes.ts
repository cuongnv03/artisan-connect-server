import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { CreateProductController } from '../controllers/product/CreateProductController';
import { UpdateProductController } from '../controllers/product/UpdateProductController';
import { GetProductController } from '../controllers/product/GetProductController';
import { GetProductBySlugController } from '../controllers/product/GetProductBySlugController';
import { GetProductsController } from '../controllers/product/GetProductsController';
import { GetMyProductsController } from '../controllers/product/GetMyProductsController';
import { DeleteProductController } from '../controllers/product/DeleteProductController';
import { UpdatePriceController } from '../controllers/product/UpdatePriceController';
import { GetPriceHistoryController } from '../controllers/product/GetPriceHistoryController';
import { PublishProductController } from '../controllers/product/PublishProductController';
import { UnpublishProductController } from '../controllers/product/UnpublishProductController';
import { SearchProductsController } from '../controllers/product/SearchProductsController';
import { GetProductStatsController } from '../controllers/product/GetProductStatsController';

// Validators
import {
  createProductSchema,
  updateProductSchema,
  updatePriceSchema,
  getProductsQuerySchema,
  searchProductsQuerySchema,
} from '../validators/product.validator';

const router = Router();

// Initialize controllers
const createProductController = new CreateProductController();
const updateProductController = new UpdateProductController();
const getProductController = new GetProductController();
const getProductBySlugController = new GetProductBySlugController();
const getProductsController = new GetProductsController();
const getMyProductsController = new GetMyProductsController();
const deleteProductController = new DeleteProductController();
const updatePriceController = new UpdatePriceController();
const getPriceHistoryController = new GetPriceHistoryController();
const publishProductController = new PublishProductController();
const unpublishProductController = new UnpublishProductController();
const searchProductsController = new SearchProductsController();
const getProductStatsController = new GetProductStatsController();

// === PUBLIC ROUTES ===
router.get('/', validate(getProductsQuerySchema, 'query'), getProductsController.execute);
router.get(
  '/search',
  validate(searchProductsQuerySchema, 'query'),
  searchProductsController.execute,
);
router.get('/slug/:slug', getProductBySlugController.execute);
router.get('/:id', validateIdParam(), getProductController.execute);
router.get('/:id/price-history', validateIdParam(), getPriceHistoryController.execute);

// === PROTECTED ROUTES ===
router.get('/my/products', authenticate, getMyProductsController.execute);
router.get('/my/stats', authenticate, getProductStatsController.execute);

router.post('/', authenticate, validate(createProductSchema), createProductController.execute);
router.patch(
  '/:id',
  authenticate,
  validateIdParam(),
  validate(updateProductSchema),
  updateProductController.execute,
);
router.delete('/:id', authenticate, validateIdParam(), deleteProductController.execute);

router.patch(
  '/:id/price',
  authenticate,
  validateIdParam(),
  validate(updatePriceSchema),
  updatePriceController.execute,
);
router.post('/:id/publish', authenticate, validateIdParam(), publishProductController.execute);
router.post('/:id/unpublish', authenticate, validateIdParam(), unpublishProductController.execute);

export default router;
