import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';

// Controllers
import { CreateCategoryController } from '../controllers/category/CreateCategoryController';
import { UpdateCategoryController } from '../controllers/category/UpdateCategoryController';
import { DeleteCategoryController } from '../controllers/category/DeleteCategoryController';
import { GetCategoryController } from '../controllers/category/GetCategoryController';
import { GetAllCategoriesController } from '../controllers/category/GetAllCategoriesController';
import { GetCategoryTreeController } from '../controllers/category/GetCategoryTreeController';
import { GetProductsByCategoryController } from '../controllers/category/GetProductsByCategoryController';

// Validators
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';

const router = Router();

// Initialize controllers
const createCategoryController = new CreateCategoryController();
const updateCategoryController = new UpdateCategoryController();
const deleteCategoryController = new DeleteCategoryController();
const getCategoryController = new GetCategoryController();
const getAllCategoriesController = new GetAllCategoriesController();
const getCategoryTreeController = new GetCategoryTreeController();
const getProductsByCategoryController = new GetProductsByCategoryController();

// Public routes
router.get('/', getAllCategoriesController.execute);
router.get('/tree', getCategoryTreeController.execute);
router.get('/:id', getCategoryController.execute);
router.get('/:id/products', getProductsByCategoryController.execute);

// Admin routes
router.post('/', authenticate, validate(createCategorySchema), createCategoryController.execute);

router.patch(
  '/:id',
  authenticate,
  validate(updateCategorySchema),
  updateCategoryController.execute,
);

router.delete('/:id', authenticate, deleteCategoryController.execute);

export default router;
