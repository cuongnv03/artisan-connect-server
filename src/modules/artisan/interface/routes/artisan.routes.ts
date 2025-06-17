import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate, authorize } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';
import {
  createArtisanProfileSchema,
  updateArtisanProfileSchema,
  searchArtisansSchema,
  upgradeRequestSchema,
  adminReviewSchema,
  verifyArtisanSchema,
  getSpecialtyArtisansSchema,
  getTopArtisansSchema,
  getSuggestedArtisansSchema,
} from '../validators/artisan.validator';

// Profile Controllers
import { CreateArtisanProfileController } from '../controllers/profile/CreateArtisanProfileController';
import { UpdateArtisanProfileController } from '../controllers/profile/UpdateArtisanProfileController';
import { GetArtisanProfileController } from '../controllers/profile/GetArtisanProfileController';
import { GetMyArtisanProfileController } from '../controllers/profile/GetMyArtisanProfileController';
import { GetArtisanProfileByUserIdController } from '../controllers/profile/GetArtisanProfileByUserIdController';
import { DeleteArtisanProfileController } from '../controllers/profile/DeleteArtisanProfileController';

// Discovery Controllers
import { SearchArtisansController } from '../controllers/discovery/SearchArtisansController';
import { GetTopArtisansController } from '../controllers/discovery/GetTopArtisansController';
import { GetArtisansBySpecialtyController } from '../controllers/discovery/GetArtisansBySpecialtyController';
import { GetFeaturedArtisansController } from '../controllers/discovery/GetFeaturedArtisansController';
import { GetSuggestedArtisansController } from '../controllers/discovery/GetSuggestedArtisansController';

// Upgrade Controllers
import { RequestUpgradeController } from '../controllers/upgrade/RequestUpgradeController';
import { GetUpgradeRequestStatusController } from '../controllers/upgrade/GetUpgradeRequestStatusController';
import { UpdateUpgradeRequestController } from '../controllers/upgrade/UpdateUpgradeRequestController';

// Admin Controllers
import { GetUpgradeRequestsController } from '../controllers/upgrade/GetUpgradeRequestsController';
import { GetUpgradeRequestByIdController } from '../controllers/upgrade/GetUpgradeRequestByIdController';
import { ApproveUpgradeRequestController } from '../controllers/upgrade/ApproveUpgradeRequestController';
import { RejectUpgradeRequestController } from '../controllers/upgrade/RejectUpgradeRequestController';
import { VerifyArtisanController } from '../controllers/upgrade/VerifyArtisanController';

const router = Router();

// Initialize controllers
const createArtisanProfileController = new CreateArtisanProfileController();
const updateArtisanProfileController = new UpdateArtisanProfileController();
const getArtisanProfileController = new GetArtisanProfileController();
const getMyArtisanProfileController = new GetMyArtisanProfileController();
const getArtisanProfileByUserIdController = new GetArtisanProfileByUserIdController();
const deleteArtisanProfileController = new DeleteArtisanProfileController();

const searchArtisansController = new SearchArtisansController();
const getTopArtisansController = new GetTopArtisansController();
const getArtisansBySpecialtyController = new GetArtisansBySpecialtyController();
const getFeaturedArtisansController = new GetFeaturedArtisansController();
const getSuggestedArtisansController = new GetSuggestedArtisansController();

const requestUpgradeController = new RequestUpgradeController();
const getUpgradeRequestStatusController = new GetUpgradeRequestStatusController();
const updateUpgradeRequestController = new UpdateUpgradeRequestController();

const getUpgradeRequestsController = new GetUpgradeRequestsController();
const getUpgradeRequestByIdController = new GetUpgradeRequestByIdController();
const approveUpgradeRequestController = new ApproveUpgradeRequestController();
const rejectUpgradeRequestController = new RejectUpgradeRequestController();
const verifyArtisanController = new VerifyArtisanController();

// === PUBLIC ROUTES ===
// Discovery routes
router.get('/search', validate(searchArtisansSchema, 'query'), searchArtisansController.execute);
router.get('/top', validate(getTopArtisansSchema, 'query'), getTopArtisansController.execute);
router.get('/featured', getFeaturedArtisansController.execute);
router.get(
  '/specialty/:specialty',
  validate(getSpecialtyArtisansSchema, 'query'),
  getArtisansBySpecialtyController.execute,
);

// Profile viewing (public)
router.get('/profile/:id', validateIdParam(), getArtisanProfileController.execute);
router.get(
  '/profile/user/:userId',
  validateIdParam('userId'),
  getArtisanProfileByUserIdController.execute,
);

// === PROTECTED ROUTES ===
// Profile management
router.post(
  '/profile',
  authenticate,
  validate(createArtisanProfileSchema),
  createArtisanProfileController.execute,
);
router.get('/profile/me', authenticate, getMyArtisanProfileController.execute);
router.patch(
  '/profile',
  authenticate,
  authorize(['ARTISAN']),
  validate(updateArtisanProfileSchema),
  updateArtisanProfileController.execute,
);
router.delete(
  '/profile',
  authenticate,
  authorize(['ARTISAN']),
  deleteArtisanProfileController.execute,
);

// Upgrade requests
router.post(
  '/upgrade-request',
  authenticate,
  validate(upgradeRequestSchema),
  requestUpgradeController.execute,
);
router.get('/upgrade-request/status', authenticate, getUpgradeRequestStatusController.execute);
router.patch(
  '/upgrade-request',
  authenticate,
  validate(upgradeRequestSchema),
  updateUpgradeRequestController.execute,
);

router.get(
  '/suggestions',
  authenticate,
  validate(getSuggestedArtisansSchema, 'query'),
  getSuggestedArtisansController.execute,
);

// === ADMIN ROUTES ===
// Upgrade request management
router.get(
  '/admin/upgrade-requests',
  authenticate,
  authorize(['ADMIN']),
  getUpgradeRequestsController.execute,
);
router.get(
  '/admin/upgrade-requests/:id',
  authenticate,
  authorize(['ADMIN']),
  validateIdParam(),
  getUpgradeRequestByIdController.execute,
);
router.post(
  '/admin/upgrade-requests/:id/approve',
  authenticate,
  authorize(['ADMIN']),
  validateIdParam(),
  validate(adminReviewSchema),
  approveUpgradeRequestController.execute,
);
router.post(
  '/admin/upgrade-requests/:id/reject',
  authenticate,
  authorize(['ADMIN']),
  validateIdParam(),
  validate(adminReviewSchema),
  rejectUpgradeRequestController.execute,
);

// Artisan verification
router.patch(
  '/admin/verify/:profileId',
  authenticate,
  authorize(['ADMIN']),
  validateIdParam('profileId'),
  validate(verifyArtisanSchema),
  verifyArtisanController.execute,
);

export default router;
