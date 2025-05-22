import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IPostRepository } from './PostRepository.interface';
import {
  Post,
  PostWithUser,
  CreatePostDto,
  UpdatePostDto,
  PostQueryOptions,
  PostPaginationResult,
  PostStatus,
  BlockType,
} from '../models/Post';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class PostRepository extends BasePrismaRepository<Post, string> implements IPostRepository {
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'post');
  }

  async findByIdWithUser(id: string, requestUserId?: string): Promise<PostWithUser | null> {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id, deletedAt: null },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                  isVerified: true,
                },
              },
            },
          },
          likes: requestUserId
            ? {
                where: { userId: requestUserId, commentId: null },
              }
            : undefined,
          savedBy: requestUserId
            ? {
                where: { userId: requestUserId },
              }
            : undefined,
        },
      });

      if (!post) return null;

      return this.transformPostWithUser(post, requestUserId);
    } catch (error) {
      this.logger.error(`Error finding post by ID: ${error}`);
      return null;
    }
  }

  async findBySlugWithUser(slug: string, requestUserId?: string): Promise<PostWithUser | null> {
    try {
      const post = await this.prisma.post.findUnique({
        where: { slug, deletedAt: null },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                  isVerified: true,
                },
              },
            },
          },
          likes: requestUserId
            ? {
                where: { userId: requestUserId, commentId: null },
              }
            : undefined,
          savedBy: requestUserId
            ? {
                where: { userId: requestUserId },
              }
            : undefined,
        },
      });

      if (!post) return null;

      return this.transformPostWithUser(post, requestUserId);
    } catch (error) {
      this.logger.error(`Error finding post by slug: ${error}`);
      return null;
    }
  }

  async createPost(userId: string, data: CreatePostDto): Promise<PostWithUser> {
    try {
      const slug = await this.generateSlug(data.title);
      const contentText = this.extractTextContent(data.content);

      const post = await this.prisma.post.create({
        data: {
          userId,
          title: data.title,
          slug,
          summary: data.summary,
          content: data.content as any,
          contentText,
          type: data.type,
          status: data.publishNow ? PostStatus.PUBLISHED : data.status || PostStatus.DRAFT,
          thumbnailUrl: data.thumbnailUrl,
          coverImage: data.coverImage,
          mediaUrls: this.extractMediaUrls(data.content),
          tags: data.tags || [],
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
          publishedAt: data.publishNow ? new Date() : null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                  isVerified: true,
                },
              },
            },
          },
        },
      });

      return this.transformPostWithUser(post, userId);
    } catch (error) {
      this.logger.error(`Error creating post: ${error}`);
      throw new AppError('Failed to create post', 500, 'DATABASE_ERROR');
    }
  }

  async updatePost(id: string, userId: string, data: UpdatePostDto): Promise<PostWithUser> {
    try {
      // Check ownership
      const existingPost = await this.prisma.post.findUnique({
        where: { id },
        select: { userId: true, title: true },
      });

      if (!existingPost) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      if (existingPost.userId !== userId) {
        throw new AppError('You can only update your own posts', 403, 'FORBIDDEN');
      }

      const updateData: any = { ...data };

      if (data.title && data.title !== existingPost.title) {
        updateData.slug = await this.generateSlug(data.title);
      }

      if (data.content) {
        updateData.contentText = this.extractTextContent(data.content);
        updateData.mediaUrls = this.extractMediaUrls(data.content);
      }

      const post = await this.prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                  isVerified: true,
                },
              },
            },
          },
        },
      });

      return this.transformPostWithUser(post, userId);
    } catch (error) {
      this.logger.error(`Error updating post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update post', 500, 'DATABASE_ERROR');
    }
  }

  async deletePost(id: string, userId: string): Promise<boolean> {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      if (post.userId !== userId) {
        throw new AppError('You can only delete your own posts', 403, 'FORBIDDEN');
      }

      await this.prisma.post.update({
        where: { id },
        data: {
          status: PostStatus.DELETED,
          deletedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete post', 500, 'DATABASE_ERROR');
    }
  }

  async publishPost(id: string, userId: string): Promise<PostWithUser> {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id },
        select: { userId: true, status: true },
      });

      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      if (post.userId !== userId) {
        throw new AppError('You can only publish your own posts', 403, 'FORBIDDEN');
      }

      if (post.status !== PostStatus.DRAFT) {
        throw new AppError('Only draft posts can be published', 400, 'INVALID_OPERATION');
      }

      const updatedPost = await this.prisma.post.update({
        where: { id },
        data: {
          status: PostStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                  isVerified: true,
                },
              },
            },
          },
        },
      });

      return this.transformPostWithUser(updatedPost, userId);
    } catch (error) {
      this.logger.error(`Error publishing post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to publish post', 500, 'DATABASE_ERROR');
    }
  }

  async archivePost(id: string, userId: string): Promise<PostWithUser> {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id },
        select: { userId: true, status: true },
      });

      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      if (post.userId !== userId) {
        throw new AppError('You can only archive your own posts', 403, 'FORBIDDEN');
      }

      if (post.status !== PostStatus.PUBLISHED) {
        throw new AppError('Only published posts can be archived', 400, 'INVALID_OPERATION');
      }

      const updatedPost = await this.prisma.post.update({
        where: { id },
        data: { status: PostStatus.ARCHIVED },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                  isVerified: true,
                },
              },
            },
          },
        },
      });

      return this.transformPostWithUser(updatedPost, userId);
    } catch (error) {
      this.logger.error(`Error archiving post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to archive post', 500, 'DATABASE_ERROR');
    }
  }

  async getPosts(options: PostQueryOptions, requestUserId?: string): Promise<PostPaginationResult> {
    try {
      const {
        userId,
        type,
        status = PostStatus.PUBLISHED,
        tags,
        search,
        followedOnly,
        page = 1,
        limit = 10,
        sortBy = 'publishedAt',
        sortOrder = 'desc',
      } = options;

      const where: Prisma.PostWhereInput = {
        deletedAt: null,
      };

      if (userId) where.userId = userId;

      if (type) {
        where.type = Array.isArray(type) ? { in: type } : type;
      }

      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }

      if (tags && tags.length > 0) {
        where.tags = { hasSome: tags };
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { contentText: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ];
      }

      if (followedOnly && requestUserId) {
        const followedUsers = await this.prisma.follow.findMany({
          where: { followerId: requestUserId, status: 'accepted' },
          select: { followingId: true },
        });

        where.userId = { in: followedUsers.map((f) => f.followingId) };
      }

      const total = await this.prisma.post.count({ where });
      const totalPages = Math.ceil(total / limit);

      const posts = await this.prisma.post.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                  isVerified: true,
                },
              },
            },
          },
          likes: requestUserId
            ? {
                where: { userId: requestUserId, commentId: null },
              }
            : undefined,
          savedBy: requestUserId
            ? {
                where: { userId: requestUserId },
              }
            : undefined,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: posts.map((post) => this.transformPostWithUser(post, requestUserId)),
        meta: { total, page, limit, totalPages },
      };
    } catch (error) {
      this.logger.error(`Error getting posts: ${error}`);
      throw new AppError('Failed to get posts', 500, 'DATABASE_ERROR');
    }
  }

  async getFollowedPosts(
    userId: string,
    options: Omit<PostQueryOptions, 'followedOnly'> = {},
  ): Promise<PostPaginationResult> {
    return this.getPosts({ ...options, followedOnly: true }, userId);
  }

  async incrementViewCount(id: string): Promise<void> {
    try {
      await this.prisma.post.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.error(`Error incrementing view count: ${error}`);
      // Don't throw error for view count updates
    }
  }

  async generateSlug(title: string): Promise<string> {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (baseSlug.length < 3) {
      baseSlug = baseSlug + '-post';
    }

    const existing = await this.prisma.post.findUnique({
      where: { slug: baseSlug },
    });

    if (!existing) return baseSlug;

    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${baseSlug}-${randomStr}`;
  }

  extractTextContent(content: any[]): string {
    let text = '';

    for (const block of content) {
      switch (block.type) {
        case BlockType.PARAGRAPH:
        case BlockType.HEADING:
          text += block.data.text + ' ';
          break;
        case BlockType.QUOTE:
          text += block.data.text + ' ';
          if (block.data.author) text += '- ' + block.data.author + ' ';
          break;
        case BlockType.LIST:
          if (block.data.items) {
            block.data.items.forEach((item: string) => (text += item + ' '));
          }
          break;
      }
    }

    return text.trim();
  }

  async getPostStatusCounts(userId: string): Promise<Record<string, number>> {
    try {
      const counts = await this.prisma.post.groupBy({
        by: ['status'],
        where: {
          userId,
          deletedAt: null,
        },
        _count: {
          status: true,
        },
      });

      // Initialize all statuses with 0
      const result: Record<string, number> = {
        [PostStatus.DRAFT]: 0,
        [PostStatus.PUBLISHED]: 0,
        [PostStatus.ARCHIVED]: 0,
      };

      // Fill in actual counts
      counts.forEach((count) => {
        result[count.status] = count._count.status;
      });

      return result;
    } catch (error) {
      this.logger.error(`Error getting post status counts: ${error}`);
      throw new AppError('Failed to get post status counts', 500, 'DATABASE_ERROR');
    }
  }

  private extractMediaUrls(content: any[]): string[] {
    const urls: string[] = [];

    for (const block of content) {
      switch (block.type) {
        case BlockType.IMAGE:
          if (block.data.url) urls.push(block.data.url);
          break;
        case BlockType.GALLERY:
          if (block.data.images) {
            block.data.images.forEach((img: any) => {
              if (img.url) urls.push(img.url);
            });
          }
          break;
        case BlockType.VIDEO:
          if (block.data.url) urls.push(block.data.url);
          break;
      }
    }

    return urls;
  }

  private transformPostWithUser(post: any, requestUserId?: string): PostWithUser {
    const { likes, savedBy, ...postData } = post;

    return {
      ...postData,
      content: Array.isArray(postData.content) ? postData.content : [],
      isLiked: requestUserId ? likes?.length > 0 : undefined,
      isSaved: requestUserId ? savedBy?.length > 0 : undefined,
      canEdit: requestUserId ? postData.userId === requestUserId : false,
    };
  }
}
