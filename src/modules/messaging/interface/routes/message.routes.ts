import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Core Controllers
import { SendMessageController } from '../controllers/core/SendMessageController';
import { GetConversationsController } from '../controllers/core/GetConversationsController';
import { GetConversationMessagesController } from '../controllers/core/GetConversationMessagesController';
import { GetMessagesController } from '../controllers/core/GetMessagesController';
import { MarkAsReadController } from '../controllers/core/MarkAsReadController';
import { MarkConversationAsReadController } from '../controllers/core/MarkConversationAsReadController';
import { DeleteMessageController } from '../controllers/core/DeleteMessageController';
import { GetUnreadCountController } from '../controllers/core/GetUnreadCountController';

// Media Controllers
import { SendMediaMessageController } from '../controllers/media/SendMediaMessageController';

// Quote Controllers
import { SendQuoteMessageController } from '../controllers/quote/SendQuoteMessageController';

// Custom Order Controllers
import { SendCustomOrderController } from '../controllers/customOrder/SendCustomOrderController';
import { GetNegotiationHistoryController } from '../controllers/customOrder/GetNegotiationHistoryController';
import { GetActiveNegotiationsController } from '../controllers/customOrder/GetActiveNegotiationsController';
import { UpdateCustomOrderProposalController } from '../controllers/customOrder/UpdateCustomOrderProposalController';
import { CancelNegotiationController } from '../controllers/customOrder/CancelNegotiationController';

// Validators
import {
  sendMessageSchema,
  getMessagesQuerySchema,
  sendQuoteMessageSchema,
  sendMediaMessageSchema,
} from '../validators/message.validator';

import {
  sendCustomOrderSchema,
  updateCustomOrderProposalSchema,
  cancelNegotiationSchema,
} from '../validators/customOrder.validator';

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

const sendMediaMessageController = new SendMediaMessageController();

const sendQuoteMessageController = new SendQuoteMessageController();

const sendCustomOrderController = new SendCustomOrderController();
const getNegotiationHistoryController = new GetNegotiationHistoryController();
const getActiveNegotiationsController = new GetActiveNegotiationsController();
const updateCustomOrderProposalController = new UpdateCustomOrderProposalController();
const cancelNegotiationController = new CancelNegotiationController();

// All routes require authentication
router.use(authenticate);

// ===== CORE MESSAGING =====
// Send basic message
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

// ===== MEDIA MESSAGING =====
// Send media message (images, files)
router.post('/media', validate(sendMediaMessageSchema), sendMediaMessageController.execute);

// ===== QUOTE INTEGRATION =====
// Send quote discussion message
router.post(
  '/quote-discussion',
  validate(sendQuoteMessageSchema),
  sendQuoteMessageController.execute,
);

// ===== CUSTOM ORDER NEGOTIATION =====
// Send custom order (proposal, response, or simple message)
router.post('/custom-order', validate(sendCustomOrderSchema), sendCustomOrderController.execute);

// Get active negotiations
router.get('/negotiations', getActiveNegotiationsController.execute);

// Get negotiation history
router.get(
  '/negotiations/:negotiationId/history',
  validateIdParam('negotiationId'),
  getNegotiationHistoryController.execute,
);

// Update custom order proposal
router.patch(
  '/negotiations/:negotiationId/proposal',
  validateIdParam('negotiationId'),
  validate(updateCustomOrderProposalSchema),
  updateCustomOrderProposalController.execute,
);

// Cancel negotiation
router.post(
  '/negotiations/:negotiationId/cancel',
  validateIdParam('negotiationId'),
  validate(cancelNegotiationSchema),
  cancelNegotiationController.execute,
);

export default router;
