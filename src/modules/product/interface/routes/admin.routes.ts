import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

import { AdminProductController } from '../controllers/admin/AdminProductController';
import { AdminCategoryController } from '../controllers/admin/AdminCategoryController';

import {
  createCategorySchema,
  updateCategorySchema,
  createCategoryAttributeTemplateSchema,
} from '../validators/category.validator';

const router = Router();

// Initialize controllers
const adminProductController = new AdminProductController();
const adminCategoryController = new AdminCategoryController();

// === ADMIN PRODUCT ROUTES ===
router.get('/products', authenticate, adminProductController.execute);
router.patch(
  '/products/:id/status',
  authenticate,
  validateIdParam(),
  adminProductController.updateProductStatus,
);
router.delete(
  '/products/:id',
  authenticate,
  validateIdParam(),
  adminProductController.deleteProduct,
);

// === ADMIN CATEGORY ROUTES ===
router.get('/categories', authenticate, adminCategoryController.execute);
router.post(
  '/categories',
  authenticate,
  validate(createCategorySchema),
  adminCategoryController.createCategory,
);
router.patch(
  '/categories/:id',
  authenticate,
  validateIdParam(),
  validate(updateCategorySchema),
  adminCategoryController.updateCategory,
);
router.delete(
  '/categories/:id',
  authenticate,
  validateIdParam(),
  adminCategoryController.deleteCategory,
);

// === CATEGORY ATTRIBUTE TEMPLATE ROUTES ===
router.get(
  '/categories/:categoryId/attributes',
  authenticate,
  validateIdParam('categoryId'),
  adminCategoryController.getAttributeTemplates,
);
router.post(
  '/categories/:categoryId/attributes',
  authenticate,
  validateIdParam('categoryId'),
  validate(createCategoryAttributeTemplateSchema),
  adminCategoryController.createAttributeTemplate,
);
router.delete(
  '/categories/attributes/:templateId',
  authenticate,
  validateIdParam('templateId'),
  adminCategoryController.deleteAttributeTemplate,
);

export default router;
