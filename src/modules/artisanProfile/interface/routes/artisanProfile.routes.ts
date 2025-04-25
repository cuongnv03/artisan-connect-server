import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { authorize } from '../../../../shared/middlewares/auth.middleware';
import {
  createArtisanProfileSchema,
  updateArtisanProfileSchema,
  generateTemplateSchema,
  artisanUpgradeRequestSchema,
  adminNotesSchema,
} from '../validators/artisanProfile.validator';

// Import controllers
import { CreateArtisanProfileController } from '../controllers/CreateArtisanProfileController';
import { UpdateArtisanProfileController } from '../controllers/UpdateArtisanProfileController';
import { GetArtisanProfileController } from '../controllers/GetArtisanProfileController';
import { GetMyArtisanProfileController } from '../controllers/GetMyArtisanProfileController';
import { GetArtisanProfileByUserIdController } from '../controllers/GetArtisanProfileByUserIdController';
import { GenerateTemplateController } from '../controllers/GenerateTemplateController';
import { GetDefaultTemplatesController } from '../controllers/GetDefaultTemplatesController';
import { RequestUpgradeController } from '../controllers/RequestUpgradeController';
import { GetUpgradeRequestStatusController } from '../controllers/GetUpgradeRequestStatusController';
import { GetUpgradeRequestsController } from '../controllers/GetUpgradeRequestsController';
import { ApproveUpgradeRequestController } from '../controllers/ApproveUpgradeRequestController';
import { RejectUpgradeRequestController } from '../controllers/RejectUpgradeRequestController';

const router = Router();

// Initialize controllers
const createArtisanProfileController = new CreateArtisanProfileController();
const updateArtisanProfileController = new UpdateArtisanProfileController();
const getArtisanProfileController = new GetArtisanProfileController();
const getMyArtisanProfileController = new GetMyArtisanProfileController();
const getArtisanProfileByUserIdController = new GetArtisanProfileByUserIdController();
const generateTemplateController = new GenerateTemplateController();
const getDefaultTemplatesController = new GetDefaultTemplatesController();
const requestUpgradeController = new RequestUpgradeController();
const getUpgradeRequestStatusController = new GetUpgradeRequestStatusController();
const getUpgradeRequestsController = new GetUpgradeRequestsController();
const approveUpgradeRequestController = new ApproveUpgradeRequestController();
const rejectUpgradeRequestController = new RejectUpgradeRequestController();

// Public routes - don't require authentication
router.get('/templates', getDefaultTemplatesController.execute);
router.get('/:id', getArtisanProfileController.execute);
router.get('/user/:userId', getArtisanProfileByUserIdController.execute);

// Protected routes - require authentication
router.post(
  '/',
  authenticate,
  validate(createArtisanProfileSchema),
  createArtisanProfileController.execute,
);

router.get('/', authenticate, getMyArtisanProfileController.execute);

// Artisan routes - require artisan role
router.patch(
  '/',
  authenticate,
  authorize(['ARTISAN']),
  validate(updateArtisanProfileSchema),
  updateArtisanProfileController.execute,
);

router.post(
  '/generate-template',
  authenticate,
  authorize(['ARTISAN']),
  validate(generateTemplateSchema),
  generateTemplateController.execute,
);

// Upgrade request routes
router.post(
  '/upgrade-request',
  authenticate,
  validate(artisanUpgradeRequestSchema),
  requestUpgradeController.execute,
);

router.get('/upgrade-request/status', authenticate, getUpgradeRequestStatusController.execute);

// Admin routes
router.get(
  '/upgrade-requests',
  authenticate,
  authorize(['ADMIN']),
  getUpgradeRequestsController.execute,
);

router.post(
  '/upgrade-requests/:id/approve',
  authenticate,
  authorize(['ADMIN']),
  approveUpgradeRequestController.execute,
);

router.post(
  '/upgrade-requests/:id/reject',
  authenticate,
  authorize(['ADMIN']),
  validate(adminNotesSchema),
  rejectUpgradeRequestController.execute,
);

export default router;
