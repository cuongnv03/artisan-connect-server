import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Product Controllers
import { CreateProductController } from '../controllers/product/CreateProductController';
import { UpdateProductController } from '../controllers/product/UpdateProductController';
import { GetProductController } from '../controllers/product/GetProductController';
import { GetProductBySlugController } from '../controllers/product/GetProductBySlugController';
import { GetProductsController } from '../controllers/product/GetProductsController';
import { GetMyProductsController } from '../controllers/product/GetMyProductsController';
import { DeleteProductController } from '../controllers/product/DeleteProductController';
import { UpdatePriceController } from '../controllers/product/UpdatePriceController';
import { GetPriceHistoryController } from '../controllers/product/GetPriceHistoryController';

// Additional Controllers
import { PublishProductController } from '../controllers/product/PublishProductController';
import { UnpublishProductController } from '../controllers/product/UnpublishProductController';
import { GetFeaturedProductsController } from '../controllers/product/GetFeaturedProductsController';
import { GetRelatedProductsController } from '../controllers/product/GetRelatedProductsController';
import { SearchProductsController } from '../controllers/product/SearchProductsController';
import { GetProductStatsController } from '../controllers/product/GetProductStatsController';

// Validators
import {
  createProductSchema,
  updateProductSchema,
  updatePriceSchema,
  getProductsQuerySchema,
  stockUpdateSchema,
  inventoryCheckSchema,
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
const getFeaturedProductsController = new GetFeaturedProductsController();
const getRelatedProductsController = new GetRelatedProductsController();
const searchProductsController = new SearchProductsController();
const getProductStatsController = new GetProductStatsController();

// === PUBLIC ROUTES ===
// Get products (public with filtering)
router.get('/', validate(getProductsQuerySchema, 'query'), getProductsController.execute);

// Get product by slug (public)
router.get('/slug/:slug', getProductBySlugController.execute);

// Get product by ID (public)
router.get('/:id', validateIdParam(), getProductController.execute);

// Get featured products (public)
router.get('/featured/list', getFeaturedProductsController.execute);

// Get related products (public)
router.get('/:id/related', validateIdParam(), getRelatedProductsController.execute);

// Search products (public)
router.get('/search/query', searchProductsController.execute);

// Get price history (public)
router.get('/:id/price-history', validateIdParam(), getPriceHistoryController.execute);

// === PROTECTED ROUTES ===
// My products management
router.get('/my/products', authenticate, getMyProductsController.execute);
router.get('/my/stats', authenticate, getProductStatsController.execute);

// Product CRUD
router.post('/', authenticate, validate(createProductSchema), createProductController.execute);
router.patch(
  '/:id',
  authenticate,
  validateIdParam(),
  validate(updateProductSchema),
  updateProductController.execute,
);
router.delete('/:id', authenticate, validateIdParam(), deleteProductController.execute);

// Price management
router.patch(
  '/:id/price',
  authenticate,
  validateIdParam(),
  validate(updatePriceSchema),
  updatePriceController.execute,
);

// Product status management
router.post('/:id/publish', authenticate, validateIdParam(), publishProductController.execute);
router.post('/:id/unpublish', authenticate, validateIdParam(), unpublishProductController.execute);

export default router;
