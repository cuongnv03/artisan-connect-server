import Joi from 'joi';
import { PostType, PostStatus, BlockType } from '../../models/Post';

// Schema for content blocks
const contentBlockSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string()
    .valid(...Object.values(BlockType))
    .required(),
  data: Joi.object().required(),
});

export const createPostSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  summary: Joi.string().max(500),
  content: Joi.array().items(contentBlockSchema).required(),
  type: Joi.string()
    .valid(...Object.values(PostType))
    .required(),
  status: Joi.string()
    .valid(...Object.values(PostStatus))
    .required(),
  thumbnailUrl: Joi.string().uri(),
  coverImage: Joi.string().uri(),
  tags: Joi.array().items(Joi.string()),
  productIds: Joi.array().items(Joi.string().uuid()),
  templateId: Joi.string(),
  templateData: Joi.object(),
  publishNow: Joi.boolean().default(false),
});

export const updatePostSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  summary: Joi.string().max(500).allow(null, ''),
  content: Joi.array().items(contentBlockSchema),
  type: Joi.string().valid(...Object.values(PostType)),
  status: Joi.string().valid(...Object.values(PostStatus)),
  thumbnailUrl: Joi.string().uri().allow(null, ''),
  coverImage: Joi.string().uri().allow(null, ''),
  tags: Joi.array().items(Joi.string()),
  productIds: Joi.array().items(Joi.string().uuid()),
  templateId: Joi.string().allow(null, ''),
  templateData: Joi.object(),
}).min(1);

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
  tag: Joi.string(),
  search: Joi.string(),
  sortBy: Joi.string().valid('createdAt', 'publishedAt', 'viewCount', 'likeCount', 'commentCount'),
  sortOrder: Joi.string().valid('asc', 'desc'),
  followedOnly: Joi.boolean(),
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
  sortBy: Joi.string().valid(
    'createdAt',
    'updatedAt',
    'publishedAt',
    'viewCount',
    'likeCount',
    'commentCount',
  ),
  sortOrder: Joi.string().valid('asc', 'desc'),
});
