import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';

// Controllers
import { GetNotificationsController } from '../controllers/GetNotificationsController';
import { GetUnreadCountController } from '../controllers/GetUnreadCountController';
import { MarkAsReadController } from '../controllers/MarkAsReadController';
import { MarkAllAsReadController } from '../controllers/MarkAllAsReadController';
import { DeleteNotificationController } from '../controllers/DeleteNotificationController';
import { GetNotificationTypesController } from '../controllers/GetNotificationTypesController';
import { GetUserPreferencesController } from '../controllers/GetUserPreferencesController';
import { UpdateUserPreferencesController } from '../controllers/UpdateUserPreferencesController';
import { updatePreferencesSchema } from '../validators/notification.validator';

// Validators
import { notificationQuerySchema } from '../validators/notification.validator';

const router = Router();

// Initialize controllers
const getNotificationsController = new GetNotificationsController();
const getUnreadCountController = new GetUnreadCountController();
const markAsReadController = new MarkAsReadController();
const markAllAsReadController = new MarkAllAsReadController();
const deleteNotificationController = new DeleteNotificationController();
const getNotificationTypesController = new GetNotificationTypesController();
const getUserPreferencesController = new GetUserPreferencesController();
const updateUserPreferencesController = new UpdateUserPreferencesController();

// Public routes
router.get('/types', getNotificationTypesController.execute);

// Protected routes - require authentication
router.use(authenticate);

router.get('/', validate(notificationQuerySchema, 'query'), getNotificationsController.execute);

router.get('/unread-count', getUnreadCountController.execute);
router.post('/:id/read', markAsReadController.execute);
router.post('/read-all', markAllAsReadController.execute);
router.delete('/:id', deleteNotificationController.execute);
router.get('/preferences', getUserPreferencesController.execute);
router.put(
  '/preferences',
  validate(updatePreferencesSchema),
  updateUserPreferencesController.execute,
);

export default router;
