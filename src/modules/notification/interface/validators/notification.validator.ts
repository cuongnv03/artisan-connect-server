import Joi from 'joi';
import { NotificationType } from '../../domain/entities/Notification';

export const notificationQuerySchema = Joi.object({
  unreadOnly: Joi.boolean().default(false),
  type: Joi.string().valid(...Object.values(NotificationType)),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const updatePreferencesSchema = Joi.object({
  preferences: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid(...Object.values(NotificationType))
          .required(),
        enabled: Joi.boolean().required(),
      }),
    )
    .required(),
});
