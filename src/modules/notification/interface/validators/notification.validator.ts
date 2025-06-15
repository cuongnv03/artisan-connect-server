import Joi from 'joi';
import { NotificationType } from '../../models/Notification';

export const createNotificationSchema = Joi.object({
  recipientId: Joi.string().uuid().required().messages({
    'string.uuid': 'Recipient ID must be a valid UUID',
    'any.required': 'Recipient ID is required',
  }),
  senderId: Joi.string().uuid().allow(null),
  type: Joi.string()
    .valid(...Object.values(NotificationType))
    .required()
    .messages({
      'any.required': 'Notification type is required',
      'any.only': 'Invalid notification type',
    }),
  title: Joi.string().required().max(100).messages({
    'string.empty': 'Title is required',
    'string.max': 'Title cannot exceed 100 characters',
    'any.required': 'Title is required',
  }),
  message: Joi.string().required().max(500).messages({
    'string.empty': 'Message is required',
    'string.max': 'Message cannot exceed 500 characters',
    'any.required': 'Message is required',
  }),
  data: Joi.object().allow(null),
  actionUrl: Joi.string().uri().allow(null, '').messages({
    // THÊM MỚI
    'string.uri': 'Action URL must be a valid URL',
  }),
});

export const getNotificationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  isRead: Joi.boolean(),
  types: Joi.alternatives().try(
    Joi.string().valid(...Object.values(NotificationType)),
    Joi.array().items(Joi.string().valid(...Object.values(NotificationType))),
  ),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
});

export const markNotificationsSchema = Joi.object({
  notificationIds: Joi.array().items(Joi.string().uuid()).min(1).max(50).messages({
    'array.min': 'At least one notification ID is required',
    'array.max': 'Maximum 50 notifications can be marked at once',
  }),
});
