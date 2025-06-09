import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Variant Controllers
import { CreateProductVariantController } from '../controllers/variant/CreateProductVariantController';
import { GetProductVariantsController } from '../controllers/variant/GetProductVariantsController';
import { UpdateProductVariantController } from '../controllers/variant/UpdateProductVariantController';
import { DeleteProductVariantController } from '../controllers/variant/DeleteProductVariantController';
import { GenerateVariantsController } from '../controllers/variant/GenerateVariantsController';

// Validators
import {
  createProductVariantSchema,
  updateProductVariantSchema,
} from '../validators/variant.validator';

const router = Router();

// Initialize controllers
const createProductVariantController = new CreateProductVariantController();
const getProductVariantsController = new GetProductVariantsController();
const updateProductVariantController = new UpdateProductVariantController();
const deleteProductVariantController = new DeleteProductVariantController();
const generateVariantsController = new GenerateVariantsController();

// === PRODUCT VARIANTS ===
// Get product variants (public)
router.get(
  '/products/:productId/variants',
  validateIdParam('productId'),
  getProductVariantsController.execute,
);

// Create product variant (artisan only)
router.post(
  '/products/:productId/variants',
  authenticate,
  validateIdParam('productId'),
  validate(createProductVariantSchema),
  createProductVariantController.execute,
);

// Update product variant (artisan only)
router.patch(
  '/variants/:variantId',
  authenticate,
  validateIdParam('variantId'),
  validate(updateProductVariantSchema),
  updateProductVariantController.execute,
);

// Delete product variant (artisan only)
router.delete(
  '/variants/:variantId',
  authenticate,
  validateIdParam('variantId'),
  deleteProductVariantController.execute,
);

// Generate variants from attributes (artisan only)
router.post(
  '/products/:productId/variants/generate',
  authenticate,
  validateIdParam('productId'),
  generateVariantsController.execute,
);

export default router;
