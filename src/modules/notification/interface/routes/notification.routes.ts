import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { GetNotificationsController } from '../controllers/GetNotificationsController';
import { GetUnreadCountController } from '../controllers/GetUnreadCountController';
import { MarkAsReadController } from '../controllers/MarkAsReadController';
import { MarkAllAsReadController } from '../controllers/MarkAllAsReadController';
import { DeleteNotificationController } from '../controllers/DeleteNotificationController';

// Validators
import { getNotificationsQuerySchema } from '../validators/notification.validator';

const router = Router();

// Initialize controllers
const getNotificationsController = new GetNotificationsController();
const getUnreadCountController = new GetUnreadCountController();
const markAsReadController = new MarkAsReadController();
const markAllAsReadController = new MarkAllAsReadController();
const deleteNotificationController = new DeleteNotificationController();

// All routes require authentication
router.use(authenticate);

// === NOTIFICATION ROUTES ===
// Get user notifications
router.get('/', validate(getNotificationsQuerySchema, 'query'), getNotificationsController.execute);

// Get unread count
router.get('/unread-count', getUnreadCountController.execute);

// Mark notification as read
router.patch('/:id/read', validateIdParam(), markAsReadController.execute);

// Mark all notifications as read
router.patch('/read-all', markAllAsReadController.execute);

// Delete notification
router.delete('/:id', validateIdParam(), deleteNotificationController.execute);

export default router;
