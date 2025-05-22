import Joi from 'joi';
import { PostType, PostStatus, BlockType } from '../../models/Post';

const contentBlockSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string()
    .valid(...Object.values(BlockType))
    .required(),
  data: Joi.object().required(),
  order: Joi.number().integer().min(0).required(),
});

export const createPostSchema = Joi.object({
  title: Joi.string().required().min(3).max(200).messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title cannot exceed 200 characters',
  }),
  summary: Joi.string().max(500).allow('').messages({
    'string.max': 'Summary cannot exceed 500 characters',
  }),
  content: Joi.array().items(contentBlockSchema).required().min(1).messages({
    'array.min': 'Post must have at least one content block',
    'any.required': 'Content is required',
  }),
  type: Joi.string()
    .valid(...Object.values(PostType))
    .required()
    .messages({
      'any.required': 'Post type is required',
    }),
  status: Joi.string()
    .valid(...Object.values(PostStatus))
    .default(PostStatus.DRAFT),
  thumbnailUrl: Joi.string().uri().allow('').messages({
    'string.uri': 'Thumbnail URL must be a valid URL',
  }),
  coverImage: Joi.string().uri().allow('').messages({
    'string.uri': 'Cover image URL must be a valid URL',
  }),
  tags: Joi.array().items(Joi.string().max(50)).max(10).messages({
    'array.max': 'Maximum 10 tags allowed',
    'string.max': 'Each tag cannot exceed 50 characters',
  }),
  publishNow: Joi.boolean().default(false),
});

export const updatePostSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  summary: Joi.string().max(500).allow(''),
  content: Joi.array().items(contentBlockSchema).min(1),
  type: Joi.string().valid(...Object.values(PostType)),
  status: Joi.string().valid(...Object.values(PostStatus)),
  thumbnailUrl: Joi.string().uri().allow(''),
  coverImage: Joi.string().uri().allow(''),
  tags: Joi.array().items(Joi.string().max(50)).max(10),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

export const getPostsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  userId: Joi.string().uuid(),
  type: Joi.alternatives().try(
    Joi.string().valid(...Object.values(PostType)),
    Joi.array().items(Joi.string().valid(...Object.values(PostType))),
  ),
  status: Joi.alternatives().try(
    Joi.string().valid(...Object.values(PostStatus)),
    Joi.array().items(Joi.string().valid(...Object.values(PostStatus))),
  ),
  tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
  search: Joi.string().max(100).allow(''),
  followedOnly: Joi.boolean().default(false),
  sortBy: Joi.string()
    .valid('createdAt', 'publishedAt', 'viewCount', 'likeCount', 'commentCount')
    .default('publishedAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const getMyPostsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.alternatives().try(
    Joi.string().valid(...Object.values(PostStatus)),
    Joi.array().items(Joi.string().valid(...Object.values(PostStatus))),
  ),
  type: Joi.alternatives().try(
    Joi.string().valid(...Object.values(PostType)),
    Joi.array().items(Joi.string().valid(...Object.values(PostType))),
  ),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'publishedAt', 'viewCount', 'likeCount', 'commentCount')
    .default('updatedAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});
