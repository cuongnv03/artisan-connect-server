import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/auth.middleware';
import {
  createArtisanProfileSchema,
  updateArtisanProfileSchema,
  generateTemplateSchema,
  artisanUpgradeRequestSchema,
  adminNotesSchema,
} from '../validators/artisanProfile.validator';

// Import controllers
import { CreateArtisanProfileController } from '../controllers/artisanProfile/CreateArtisanProfileController';
import { UpdateArtisanProfileController } from '../controllers/artisanProfile/UpdateArtisanProfileController';
import { GetArtisanProfileController } from '../controllers/artisanProfile/GetArtisanProfileController';
import { GetMyArtisanProfileController } from '../controllers/artisanProfile/GetMyArtisanProfileController';
import { GetArtisanProfileByUserIdController } from '../controllers/artisanProfile/GetArtisanProfileByUserIdController';
import { GenerateTemplateController } from '../controllers/artisanProfile/GenerateTemplateController';
import { GetDefaultTemplatesController } from '../controllers/artisanProfile/GetDefaultTemplatesController';
import { RequestUpgradeController } from '../controllers/artisanProfile/RequestUpgradeController';
import { GetUpgradeRequestStatusController } from '../controllers/artisanProfile/GetUpgradeRequestStatusController';
import { GetUpgradeRequestsController } from '../controllers/artisanProfile/GetUpgradeRequestsController';
import { ApproveUpgradeRequestController } from '../controllers/artisanProfile/ApproveUpgradeRequestController';
import { RejectUpgradeRequestController } from '../controllers/artisanProfile/RejectUpgradeRequestController';

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
