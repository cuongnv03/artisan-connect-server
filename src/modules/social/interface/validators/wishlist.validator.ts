import Joi from 'joi';
import { WishlistItemType } from '../../models/Wishlist';

export const addToWishlistSchema = Joi.object({
  itemType: Joi.string()
    .valid(...Object.values(WishlistItemType))
    .required()
    .messages({
      'any.required': 'Item type is required',
      'any.only': 'Item type must be either PRODUCT or POST',
    }),
  productId: Joi.string().uuid().when('itemType', {
    is: WishlistItemType.PRODUCT,
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  postId: Joi.string().uuid().when('itemType', {
    is: WishlistItemType.POST,
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
}).messages({
  'object.unknown': 'Invalid field provided',
});

export const getWishlistSchema = Joi.object({
  itemType: Joi.string().valid(...Object.values(WishlistItemType)),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const wishlistItemParamsSchema = Joi.object({
  itemType: Joi.string()
    .valid(...Object.values(WishlistItemType))
    .required(),
  itemId: Joi.string().uuid().required(),
});
