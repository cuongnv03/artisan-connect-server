import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { updateProfileSchema, searchUsersSchema } from '../validators/user.validator';

// Controllers
import { UpdateProfileController } from '../controllers/user/UpdateProfileController';
import { GetUserProfileController } from '../controllers/user/GetUserProfileController';
import { SearchUsersController } from '../controllers/user/SearchUsersController';
import { DeleteAccountController } from '../controllers/user/DeleteAccountController';

const router = Router();

// Initialize controllers
const updateProfileController = new UpdateProfileController();
const getUserProfileController = new GetUserProfileController();
const searchUsersController = new SearchUsersController();
const deleteAccountController = new DeleteAccountController();

// Public routes
router.get('/search', validate(searchUsersSchema, 'query'), searchUsersController.execute);
router.get('/:id', getUserProfileController.execute);

// Protected routes
router.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  updateProfileController.execute,
);
router.delete('/account', authenticate, deleteAccountController.execute);

export default router;
