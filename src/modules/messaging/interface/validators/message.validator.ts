import Joi from 'joi';
import { MessageType } from '../../models/Message';

export const sendMessageSchema = Joi.object({
  receiverId: Joi.string().uuid().required().messages({
    'string.uuid': 'Receiver ID must be a valid UUID',
    'any.required': 'Receiver ID is required',
  }),
  content: Joi.string().required().min(1).max(2000).messages({
    'string.empty': 'Message content is required',
    'string.min': 'Message cannot be empty',
    'string.max': 'Message cannot exceed 2000 characters',
    'any.required': 'Message content is required',
  }),
  type: Joi.string()
    .valid(...Object.values(MessageType))
    .default(MessageType.TEXT),
  metadata: Joi.object().allow(null),
});

export const getMessagesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  conversationWith: Joi.string().uuid(),
  type: Joi.string().valid(...Object.values(MessageType)),
  isRead: Joi.boolean(),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
});

export const sendQuoteMessageSchema = Joi.object({
  quoteId: Joi.string().uuid().required().messages({
    'string.uuid': 'Quote ID must be a valid UUID',
    'any.required': 'Quote ID is required',
  }),
  content: Joi.string().required().min(1).max(2000).messages({
    'string.empty': 'Message content is required',
    'string.min': 'Message cannot be empty',
    'string.max': 'Message cannot exceed 2000 characters',
    'any.required': 'Message content is required',
  }),
});

export const sendCustomOrderSchema = Joi.object({
  receiverId: Joi.string().uuid().required(),
  content: Joi.string().required().min(1).max(2000),
  orderData: Joi.object({
    productName: Joi.string().required().max(200),
    description: Joi.string().max(2000),
    estimatedPrice: Joi.number().positive(),
    estimatedDuration: Joi.string().max(100),
    specifications: Joi.object(),
  }).required(),
});

export const sendMediaMessageSchema = Joi.object({
  receiverId: Joi.string().uuid().required(),
  mediaUrl: Joi.string().uri().required().messages({
    'string.uri': 'Media URL must be a valid URL',
    'any.required': 'Media URL is required',
  }),
  mediaType: Joi.string().valid('image', 'file').required(),
  content: Joi.string().max(500).allow(''),
});
