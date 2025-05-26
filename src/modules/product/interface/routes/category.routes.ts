import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { CreateCategoryController } from '../controllers/category/CreateCategoryController';
import { UpdateCategoryController } from '../controllers/category/UpdateCategoryController';
import { GetCategoryController } from '../controllers/category/GetCategoryController';
import { GetCategoryBySlugController } from '../controllers/category/GetCategoryBySlugController';
import { GetAllCategoriesController } from '../controllers/category/GetAllCategoriesController';
import { GetCategoryTreeController } from '../controllers/category/GetCategoryTreeController';
import { DeleteCategoryController } from '../controllers/category/DeleteCategoryController';

// Validators
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';

const router = Router();

// Initialize controllers
const createCategoryController = new CreateCategoryController();
const updateCategoryController = new UpdateCategoryController();
const getCategoryController = new GetCategoryController();
const getCategoryBySlugController = new GetCategoryBySlugController();
const getAllCategoriesController = new GetAllCategoriesController();
const getCategoryTreeController = new GetCategoryTreeController();
const deleteCategoryController = new DeleteCategoryController();

// === PUBLIC ROUTES ===
// Get all categories
router.get('/', getAllCategoriesController.execute);

// Get category tree
router.get('/tree', getCategoryTreeController.execute);

// Get category by slug
router.get('/slug/:slug', getCategoryBySlugController.execute);

// Get category by ID
router.get('/:id', validateIdParam(), getCategoryController.execute);

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

export default router;
