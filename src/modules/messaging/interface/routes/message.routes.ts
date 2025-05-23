import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { SendMessageController } from '../controllers/SendMessageController';
import { GetConversationsController } from '../controllers/GetConversationsController';
import { GetConversationMessagesController } from '../controllers/GetConversationMessagesController';
import { GetMessagesController } from '../controllers/GetMessagesController';
import { MarkAsReadController } from '../controllers/MarkAsReadController';
import { MarkConversationAsReadController } from '../controllers/MarkConversationAsReadController';
import { DeleteMessageController } from '../controllers/DeleteMessageController';
import { SendQuoteMessageController } from '../controllers/SendQuoteMessageController';
import { SendCustomOrderController } from '../controllers/SendCustomOrderController';
import { SendMediaMessageController } from '../controllers/SendMediaMessageController';
import { GetUnreadCountController } from '../controllers/GetUnreadCountController';

// Validators
import {
  sendMessageSchema,
  getMessagesQuerySchema,
  sendQuoteMessageSchema,
  sendCustomOrderSchema,
  sendMediaMessageSchema,
} from '../validators/message.validator';

const router = Router();

// Initialize controllers
const sendMessageController = new SendMessageController();
const getConversationsController = new GetConversationsController();
const getConversationMessagesController = new GetConversationMessagesController();
const getMessagesController = new GetMessagesController();
const markAsReadController = new MarkAsReadController();
const markConversationAsReadController = new MarkConversationAsReadController();
const deleteMessageController = new DeleteMessageController();
const sendQuoteMessageController = new SendQuoteMessageController();
const sendCustomOrderController = new SendCustomOrderController();
const sendMediaMessageController = new SendMediaMessageController();
const getUnreadCountController = new GetUnreadCountController();

// All routes require authentication
router.use(authenticate);

// === BASIC MESSAGING ===
// Send message
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

// === MESSAGE MANAGEMENT ===
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

// === SPECIAL MESSAGE TYPES ===
// Send quote discussion message
router.post(
  '/quote-discussion',
  validate(sendQuoteMessageSchema),
  sendQuoteMessageController.execute,
);

// Send custom order proposal
router.post('/custom-order', validate(sendCustomOrderSchema), sendCustomOrderController.execute);

// Send media message
router.post('/media', validate(sendMediaMessageSchema), sendMediaMessageController.execute);

export default router;
