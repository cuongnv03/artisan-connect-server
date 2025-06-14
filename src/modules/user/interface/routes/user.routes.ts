import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate, authorize } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';
import {
  updateProfileSchema,
  updateUserProfileSchema,
  searchUsersSchema,
  createAddressSchema,
  updateAddressSchema,
} from '../validators/user.validator';

// User Controllers
import { GetUserProfileController } from '../controllers/user/GetUserProfileController';
import { UpdateProfileController } from '../controllers/user/UpdateProfileController';
import { SearchUsersController } from '../controllers/user/SearchUsersController';
import { DeleteAccountController } from '../controllers/user/DeleteAccountController';

// Profile Controllers
import { GetProfileController } from '../controllers/profile/GetProfileController';
import { UpdateUserProfileController } from '../controllers/profile/UpdateUserProfileController';

// Address Controllers
import { GetAddressesController } from '../controllers/address/GetAddressesController';
import { CreateAddressController } from '../controllers/address/CreateAddressController';
import { UpdateAddressController } from '../controllers/address/UpdateAddressController';
import { DeleteAddressController } from '../controllers/address/DeleteAddressController';
import { SetDefaultAddressController } from '../controllers/address/SetDefaultAddressController';
import { GetDefaultAddressController } from '../controllers/address/GetDefaultAddressController';

// Follow Controllers
import { FollowUserController } from '../controllers/follow/FollowUserController';
import { UnfollowUserController } from '../controllers/follow/UnfollowUserController';
import { GetFollowersController } from '../controllers/follow/GetFollowersController';
import { GetFollowingController } from '../controllers/follow/GetFollowingController';
import { GetFollowStatsController } from '../controllers/follow/GetFollowStatsController';

const router = Router();

// Initialize controllers
const getUserProfileController = new GetUserProfileController();
const updateProfileController = new UpdateProfileController();
const searchUsersController = new SearchUsersController();
const deleteAccountController = new DeleteAccountController();

const getProfileController = new GetProfileController();
const updateUserProfileController = new UpdateUserProfileController();

const getAddressesController = new GetAddressesController();
const createAddressController = new CreateAddressController();
const updateAddressController = new UpdateAddressController();
const deleteAddressController = new DeleteAddressController();
const setDefaultAddressController = new SetDefaultAddressController();
const getDefaultAddressController = new GetDefaultAddressController();

const followUserController = new FollowUserController();
const unfollowUserController = new UnfollowUserController();
const getFollowersController = new GetFollowersController();
const getFollowingController = new GetFollowingController();
const getFollowStatsController = new GetFollowStatsController();

// === PUBLIC ROUTES ===
// Search users (public) - chỉ return ARTISAN
router.get('/search', validate(searchUsersSchema, 'query'), searchUsersController.execute);

// === PROTECTED ROUTES (Specific routes first) ===

// Profile management
router.get('/profile/me', authenticate, getProfileController.execute);
router.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  updateProfileController.execute,
);
router.patch(
  '/profile/extended',
  authenticate,
  validate(updateUserProfileSchema),
  updateUserProfileController.execute,
);

// Address management (all specific routes)
router.get('/addresses', authenticate, getAddressesController.execute);
router.get('/addresses/default', authenticate, getDefaultAddressController.execute);
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

// Account management
router.delete('/account', authenticate, deleteAccountController.execute);

// === DYNAMIC USER ROUTES (CHỈ CHO ARTISAN) ===

// Get user followers/following - CHỈ CHO ARTISAN
router.get('/:userId/followers', validateIdParam('userId'), getFollowersController.execute);
router.get('/:userId/following', validateIdParam('userId'), getFollowingController.execute);
router.get('/:userId/follow-stats', validateIdParam('userId'), getFollowStatsController.execute);

// Follow management - CHỈ CÓ THỂ FOLLOW ARTISAN
router.post(
  '/:userId/follow',
  authenticate,
  validateIdParam('userId'),
  followUserController.execute,
);
router.delete(
  '/:userId/follow',
  authenticate,
  validateIdParam('userId'),
  unfollowUserController.execute,
);

// Get user profile (public) - CHỈ CHO ARTISAN - MUST BE LAST
router.get('/:id', validateIdParam(), getUserProfileController.execute);

export default router;
