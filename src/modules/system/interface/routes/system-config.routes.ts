import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { authorize } from '../../../../shared/middlewares/auth.middleware';

// Controllers
import { GetConfigController } from '../controllers/GetConfigController';
import { GetConfigValueController } from '../controllers/GetConfigValueController';
import { CreateConfigController } from '../controllers/CreateConfigController';
import { UpdateConfigController } from '../controllers/UpdateConfigController';
import { DeleteConfigController } from '../controllers/DeleteConfigController';
import { GetAllConfigsController } from '../controllers/GetAllConfigsController';
import { GetMultipleValuesController } from '../controllers/GetMultipleValuesController';
import { SetConfigValueController } from '../controllers/SetConfigValueController';

// Validators
import {
  createConfigSchema,
  updateConfigSchema,
  configQuerySchema,
  getMultipleSchema,
} from '../validators/system-config.validator';

const router = Router();

// Initialize controllers
const getConfigController = new GetConfigController();
const getConfigValueController = new GetConfigValueController();
const createConfigController = new CreateConfigController();
const updateConfigController = new UpdateConfigController();
const deleteConfigController = new DeleteConfigController();
const getAllConfigsController = new GetAllConfigsController();
const getMultipleValuesController = new GetMultipleValuesController();
const setConfigValueController = new SetConfigValueController();

// Public routes
router.get('/values/:key', getConfigValueController.execute);
router.post('/values/batch', validate(getMultipleSchema), getMultipleValuesController.execute);

// Admin only routes
router.get(
  '/',
  authenticate,
  authorize(['ADMIN']),
  validate(configQuerySchema, 'query'),
  getAllConfigsController.execute,
);

router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  validate(createConfigSchema),
  createConfigController.execute,
);

router.get('/:key', authenticate, authorize(['ADMIN']), getConfigController.execute);

router.put('/values/:key', authenticate, authorize(['ADMIN']), setConfigValueController.execute);

router.put(
  '/:key',
  authenticate,
  authorize(['ADMIN']),
  validate(updateConfigSchema),
  updateConfigController.execute,
);

router.delete('/:key', authenticate, authorize(['ADMIN']), deleteConfigController.execute);

export default router;
