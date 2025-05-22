import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Category Controllers
import { CreateCategoryController } from '../controllers/category/CreateCategoryController';
import { UpdateCategoryController } from '../controllers/category/UpdateCategoryController';
import { GetCategoryController } from '../controllers/category/GetCategoryController';
import { GetCategoryBySlugController } from '../controllers/category/GetCategoryBySlugController';
import { GetAllCategoriesController } from '../controllers/category/GetAllCategoriesController';
import { GetCategoryTreeController } from '../controllers/category/GetCategoryTreeController';
import { GetProductsByCategoryController } from '../controllers/category/GetProductsByCategoryController';
import { DeleteCategoryController } from '../controllers/category/DeleteCategoryController';
import { ReorderCategoriesController } from '../controllers/category/ReorderCategoriesController';
import { MoveCategoryController } from '../controllers/category/MoveCategoryController';

// Validators
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesQuerySchema,
  getCategoryProductsQuerySchema,
  reorderCategoriesSchema,
  moveCategorySchema,
} from '../validators/category.validator';

const router = Router();

// Initialize controllers
const createCategoryController = new CreateCategoryController();
const updateCategoryController = new UpdateCategoryController();
const getCategoryController = new GetCategoryController();
const getCategoryBySlugController = new GetCategoryBySlugController();
const getAllCategoriesController = new GetAllCategoriesController();
const getCategoryTreeController = new GetCategoryTreeController();
const getProductsByCategoryController = new GetProductsByCategoryController();
const deleteCategoryController = new DeleteCategoryController();
const reorderCategoriesController = new ReorderCategoriesController();
const moveCategoryController = new MoveCategoryController();

// === PUBLIC ROUTES ===
// Get all categories
router.get('/', validate(getCategoriesQuerySchema, 'query'), getAllCategoriesController.execute);

// Get category tree
router.get('/tree', getCategoryTreeController.execute);

// Get category by slug
router.get('/slug/:slug', getCategoryBySlugController.execute);

// Get category by ID
router.get('/:id', validateIdParam(), getCategoryController.execute);

// Get products by category
router.get(
  '/:id/products',
  validateIdParam(),
  validate(getCategoryProductsQuerySchema, 'query'),
  getProductsByCategoryController.execute,
);

// === ADMIN ROUTES ===
// Category CRUD (Admin only)
router.post('/', authenticate, validate(createCategorySchema), createCategoryController.execute);
router.patch(
  '/:id',
  authenticate,
  validateIdParam(),
  validate(updateCategorySchema),
  updateCategoryController.execute,
);
router.delete('/:id', authenticate, validateIdParam(), deleteCategoryController.execute);

// Category management (Admin only)
router.post(
  '/reorder',
  authenticate,
  validate(reorderCategoriesSchema),
  reorderCategoriesController.execute,
);
router.post(
  '/:id/move',
  authenticate,
  validateIdParam(),
  validate(moveCategorySchema),
  moveCategoryController.execute,
);

export default router;
