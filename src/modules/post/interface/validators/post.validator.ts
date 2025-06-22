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

const productMentionSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  contextText: Joi.string().max(500).allow(''),
  position: Joi.number().integer().min(0),
});

export const createPostSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  summary: Joi.string().max(500).allow(''),
  content: Joi.array().items(contentBlockSchema).required().min(1),
  type: Joi.string()
    .valid(...Object.values(PostType))
    .required(),
  status: Joi.string()
    .valid(...Object.values(PostStatus))
    .default(PostStatus.DRAFT),
  thumbnailUrl: Joi.string().uri().allow(''),
  coverImage: Joi.string().uri().allow(''),
  tags: Joi.array().items(Joi.string().max(50)).max(10),
  publishNow: Joi.boolean().default(false),
  mediaUrls: Joi.array().items(Joi.string().uri()).max(10),
  productMentions: Joi.array().items(productMentionSchema).max(5),
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
  mediaUrls: Joi.array().items(Joi.string().uri()).max(10),
  productMentions: Joi.array().items(productMentionSchema).max(5),
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
