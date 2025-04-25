import Joi from 'joi';
import { ReactionType } from '../../models/Like';

export const likeToggleSchema = Joi.object({
  postId: Joi.string().uuid(),
  commentId: Joi.string().uuid(),
  reaction: Joi.string()
    .valid(...Object.values(ReactionType))
    .default(ReactionType.LIKE),
}).xor('postId', 'commentId');

export const likeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
