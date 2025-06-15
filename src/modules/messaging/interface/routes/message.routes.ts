import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Core Controllers
import { SendMessageController } from '../controllers/SendMessageController';
import { GetConversationsController } from '../controllers/GetConversationsController';
import { GetConversationMessagesController } from '../controllers/GetConversationMessagesController';
import { GetMessagesController } from '../controllers/GetMessagesController';
import { MarkAsReadController } from '../controllers/MarkAsReadController';
import { MarkConversationAsReadController } from '../controllers/MarkConversationAsReadController';
import { DeleteMessageController } from '../controllers/DeleteMessageController';
import { GetUnreadCountController } from '../controllers/GetUnreadCountController';
import { SendCustomOrderController } from '../controllers/SendCustomOrderController';

// Validators
import {
  sendMessageSchema,
  getMessagesQuerySchema,
  sendQuoteMessageSchema,
  sendMediaMessageSchema,
} from '../validators/message.validator';
import { sendCustomOrderMessageSchema } from '../validators/customOrderMessage.validator';

const router = Router();

// Initialize controllers
const sendMessageController = new SendMessageController();
const getConversationsController = new GetConversationsController();
const getConversationMessagesController = new GetConversationMessagesController();
const getMessagesController = new GetMessagesController();
const markAsReadController = new MarkAsReadController();
const markConversationAsReadController = new MarkConversationAsReadController();
const deleteMessageController = new DeleteMessageController();
const getUnreadCountController = new GetUnreadCountController();
const sendCustomOrderController = new SendCustomOrderController();

// All routes require authentication
router.use(authenticate);

// ===== CORE MESSAGING =====
// Send message (supports all types: text, image, file, quote discussion)
router.post('/', validate(sendMessageSchema), sendMessageController.execute);

// Get conversations list
router.get('/conversations', getConversationsController.execute);

// Get messages (with filtering)
router.get('/', validate(getMessagesQuerySchema, 'query'), getMessagesController.execute);

// Get conversation messages with specific user
router.get(
  '/conversations/:userId',
  validateIdParam('userId'),
  getConversationMessagesController.execute,
);

// Get unread message count
router.get('/unread-count', getUnreadCountController.execute);

// ===== CUSTOM ORDER IN CHAT =====
router.post(
  '/custom-order',
  validate(sendCustomOrderMessageSchema),
  sendCustomOrderController.execute,
);

// ===== MESSAGE MANAGEMENT =====
// Mark message as read
router.patch('/:id/read', validateIdParam(), markAsReadController.execute);

// Mark entire conversation as read
router.patch(
  '/conversations/:userId/read',
  validateIdParam('userId'),
  markConversationAsReadController.execute,
);

// Delete message
router.delete('/:id', validateIdParam(), deleteMessageController.execute);

export default router;
