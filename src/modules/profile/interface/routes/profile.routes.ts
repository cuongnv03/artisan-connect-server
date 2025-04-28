import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Import controllers
import { GetProfileController } from '../controllers/GetProfileController';
import { UpdateProfileController } from '../controllers/UpdateProfileController';
import { GetUserProfileController } from '../controllers/GetUserProfileController';
import { GetAddressesController } from '../controllers/GetAddressesController';
import { CreateAddressController } from '../controllers/CreateAddressController';
import { UpdateAddressController } from '../controllers/UpdateAddressController';
import { DeleteAddressController } from '../controllers/DeleteAddressController';
import { SetDefaultAddressController } from '../controllers/SetDefaultAddressController';
import { GetDefaultAddressController } from '../controllers/GetDefaultAddressController';

// Import validators
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
} from '../validators/profile.validator';

const router = Router();

// Initialize controllers
const getProfileController = new GetProfileController();
const updateProfileController = new UpdateProfileController();
const getUserProfileController = new GetUserProfileController();
const getAddressesController = new GetAddressesController();
const createAddressController = new CreateAddressController();
const updateAddressController = new UpdateAddressController();
const deleteAddressController = new DeleteAddressController();
const setDefaultAddressController = new SetDefaultAddressController();
const getDefaultAddressController = new GetDefaultAddressController();

// Profile routes
router.get('/me', authenticate, getProfileController.execute);
router.patch('/me', authenticate, validate(updateProfileSchema), updateProfileController.execute);
router.get('/users/:userId', validateIdParam('userId'), getUserProfileController.execute);

// Address routes
router.get('/addresses', authenticate, getAddressesController.execute);
router.post(
  '/addresses',
  authenticate,
  validate(createAddressSchema),
  createAddressController.execute,
);
router.patch(
  '/addresses/:id',
  authenticate,
  validateIdParam(),
  validate(updateAddressSchema),
  updateAddressController.execute,
);
router.delete('/addresses/:id', authenticate, validateIdParam(), deleteAddressController.execute);
router.post(
  '/addresses/:id/default',
  authenticate,
  validateIdParam(),
  setDefaultAddressController.execute,
);
router.get('/addresses/default', authenticate, getDefaultAddressController.execute);

export default router;
