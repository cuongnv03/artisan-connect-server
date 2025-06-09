import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate, authorize } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Attribute Controllers
import { CreateCategoryAttributeTemplateController } from '../controllers/attribute/CreateCategoryAttributeTemplateController';
import { GetCategoryAttributeTemplatesController } from '../controllers/attribute/GetCategoryAttributeTemplatesController';
import { UpdateCategoryAttributeTemplateController } from '../controllers/attribute/UpdateCategoryAttributeTemplateController';
import { DeleteCategoryAttributeTemplateController } from '../controllers/attribute/DeleteCategoryAttributeTemplateController';
import { SetProductAttributesController } from '../controllers/attribute/SetProductAttributesController';
import { GetProductAttributesController } from '../controllers/attribute/GetProductAttributesController';
import { CreateCustomAttributeTemplateController } from '../controllers/attribute/CreateCustomAttributeTemplateController';
import { GetCustomAttributeTemplatesController } from '../controllers/attribute/GetCustomAttributeTemplatesController';

// Validators
import {
  createCategoryAttributeTemplateSchema,
  updateCategoryAttributeTemplateSchema,
  setProductAttributesSchema,
  createCustomAttributeTemplateSchema,
} from '../validators/attribute.validator';

const router = Router();

// Initialize controllers
const createCategoryAttributeTemplateController = new CreateCategoryAttributeTemplateController();
const getCategoryAttributeTemplatesController = new GetCategoryAttributeTemplatesController();
const updateCategoryAttributeTemplateController = new UpdateCategoryAttributeTemplateController();
const deleteCategoryAttributeTemplateController = new DeleteCategoryAttributeTemplateController();
const setProductAttributesController = new SetProductAttributesController();
const getProductAttributesController = new GetProductAttributesController();
const createCustomAttributeTemplateController = new CreateCustomAttributeTemplateController();
const getCustomAttributeTemplatesController = new GetCustomAttributeTemplatesController();

// === CATEGORY ATTRIBUTE TEMPLATES (Admin only) ===
router.post(
  '/categories/:categoryId/templates',
  authenticate,
  authorize(['ADMIN']),
  validateIdParam('categoryId'),
  validate(createCategoryAttributeTemplateSchema),
  createCategoryAttributeTemplateController.execute,
);

router.get(
  '/categories/:categoryId/templates',
  validateIdParam('categoryId'),
  getCategoryAttributeTemplatesController.execute,
);

router.patch(
  '/categories/templates/:templateId',
  authenticate,
  authorize(['ADMIN']),
  validateIdParam('templateId'),
  validate(updateCategoryAttributeTemplateSchema),
  updateCategoryAttributeTemplateController.execute,
);

router.delete(
  '/categories/templates/:templateId',
  authenticate,
  authorize(['ADMIN']),
  validateIdParam('templateId'),
  deleteCategoryAttributeTemplateController.execute,
);

// === PRODUCT ATTRIBUTES ===
router.post(
  '/products/:productId/attributes',
  authenticate,
  validateIdParam('productId'),
  validate(setProductAttributesSchema),
  setProductAttributesController.execute,
);

router.get(
  '/products/:productId/attributes',
  validateIdParam('productId'),
  getProductAttributesController.execute,
);

// === CUSTOM ATTRIBUTE TEMPLATES (Artisan) ===
router.post(
  '/custom-templates',
  authenticate,
  validate(createCustomAttributeTemplateSchema),
  createCustomAttributeTemplateController.execute,
);

router.get('/custom-templates', authenticate, getCustomAttributeTemplatesController.execute);

export default router;
