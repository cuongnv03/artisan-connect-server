import { PrismaClient, Prisma, Post as PrismaPost } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IPostRepository } from './PostRepository.interface';
import {
  Post,
  PostWithUser,
  CreatePostDto,
  UpdatePostDto,
  PostType,
  PostStatus,
  PostQueryOptions,
  PostPaginationResult,
  ContentBlock,
  BlockType,
} from '../models/Post';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class PostRepository extends BasePrismaRepository<Post, string> implements IPostRepository {
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'post');
  }

  /**
   * Find post by ID with user details
   */
  async findByIdWithUser(id: string, requestUserId?: string): Promise<PostWithUser | null> {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id },
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
          productMentions: {
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  discountPrice: true,
                  images: true,
                },
              },
            },
          },
          likes: requestUserId
            ? {
                where: {
                  userId: requestUserId,
                  commentId: null,
                },
              }
            : undefined,
          savedBy: requestUserId
            ? {
                where: {
                  userId: requestUserId,
                },
              }
            : undefined,
        },
      });

      if (!post) return null;

      // Parse the content string into an array of content blocks
      let parsedContent: ContentBlock[] = [];

      try {
        if (typeof post.content === 'string') {
          parsedContent = JSON.parse(post.content);
        } else if (Array.isArray(post.content)) {
          parsedContent = post.content as unknown as ContentBlock[];
        } else if (typeof post.content === 'object') {
          // If it's an object but not an array, convert to array with single item
          parsedContent = [post.content as unknown as ContentBlock];
        }

        // Validate that parsedContent is now an array
        if (!Array.isArray(parsedContent)) {
          this.logger.error(`Parsed content is not an array: ${typeof parsedContent}`);
          parsedContent = []; // Fallback to empty array
        }
      } catch (parseError) {
        this.logger.error(`Error parsing post content: ${parseError}`);
        parsedContent = []; // Fallback to empty array if parsing fails
      }

      // Format product mentions
      const productMentions = post.productMentions.map((mention) => ({
        productId: mention.product.id,
        name: mention.product.name,
        price: mention.product.price,
        discountPrice: mention.product.discountPrice,
        thumbnailUrl: mention.product.images.length > 0 ? mention.product.images[0] : null,
      }));

      // Transform post to include like and save status if requested
      const postWithUser: PostWithUser = {
        ...post,
        content: parsedContent,
        templateData: post.templateData as any,
        productMentions,
        liked: requestUserId ? post.likes.length > 0 : undefined,
        saved: requestUserId ? post.savedBy.length > 0 : undefined,
      };

      // Remove prisma relations that were just used for determining like/save status
      if (requestUserId) {
        delete (postWithUser as any).likes;
        delete (postWithUser as any).savedBy;
      }

      return postWithUser;
    } catch (error) {
      this.logger.error(`Error finding post by ID: ${error}`);
      return null;
    }
  }

  /**
   * Find post by slug with user details
   */
  async findBySlugWithUser(slug: string, requestUserId?: string): Promise<PostWithUser | null> {
    try {
      const post = await this.prisma.post.findUnique({
        where: { slug },
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
          productMentions: {
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  discountPrice: true,
                  images: true,
                },
              },
            },
          },
          likes: requestUserId
            ? {
                where: {
                  userId: requestUserId,
                  commentId: null,
                },
              }
            : undefined,
          savedBy: requestUserId
            ? {
                where: {
                  userId: requestUserId,
                },
              }
            : undefined,
        },
      });

      if (!post) return null;

      // Parse the content string into an array of content blocks
      let parsedContent: ContentBlock[] = [];

      try {
        if (typeof post.content === 'string') {
          parsedContent = JSON.parse(post.content);
        } else if (Array.isArray(post.content)) {
          parsedContent = post.content as unknown as ContentBlock[];
        } else if (typeof post.content === 'object') {
          // If it's an object but not an array, convert to array with single item
          parsedContent = [post.content as unknown as ContentBlock];
        }

        // Validate that parsedContent is now an array
        if (!Array.isArray(parsedContent)) {
          this.logger.error(`Parsed content is not an array: ${typeof parsedContent}`);
          parsedContent = []; // Fallback to empty array
        }
      } catch (parseError) {
        this.logger.error(`Error parsing post content: ${parseError}`);
        parsedContent = []; // Fallback to empty array if parsing fails
      }

      // Format product mentions
      const productMentions = post.productMentions.map((mention) => ({
        productId: mention.product.id,
        name: mention.product.name,
        price: mention.product.price,
        discountPrice: mention.product.discountPrice,
        thumbnailUrl: mention.product.images.length > 0 ? mention.product.images[0] : null,
      }));

      // Transform post to include like and save status if requested
      const postWithUser: PostWithUser = {
        ...post,
        content: parsedContent,
        templateData: post.templateData as any,
        productMentions,
        liked: requestUserId ? post.likes.length > 0 : undefined,
        saved: requestUserId ? post.savedBy.length > 0 : undefined,
      };

      // Remove prisma relations that were just used for determining like/save status
      if (requestUserId) {
        delete (postWithUser as any).likes;
        delete (postWithUser as any).savedBy;
      }

      return postWithUser;
    } catch (error) {
      this.logger.error(`Error finding post by slug: ${error}`);
      return null;
    }
  }

  /**
   * Create a new post
   */
  async createPost(userId: string, data: CreatePostDto): Promise<PostWithUser> {
    try {
      // Ensure content is an array before saving
      let contentToSave = data.content;
      if (!Array.isArray(contentToSave)) {
        this.logger.warn('Content is not an array, converting...');
        contentToSave = Array.isArray(data.content)
          ? data.content
          : typeof data.content === 'string'
            ? JSON.parse(data.content)
            : [data.content];
      }

      // Generate slug from title
      const slug = await this.generateSlug(data.title);

      // Extract text content from structured content for search
      const contentText = this.extractTextContent(data.content);

      // If publishing now, set publishedAt date
      const publishedAt =
        data.publishNow && data.status === PostStatus.PUBLISHED ? new Date() : null;

      // Prepare product mentions if any products are tagged
      const productConnections = data.productIds?.length
        ? data.productIds.map((id) => ({
            product: { connect: { id } },
          }))
        : undefined;

      // Create post in transaction
      const post = await this.prisma.$transaction(async (tx) => {
        // Create post
        const post = await tx.post.create({
          data: {
            userId,
            title: data.title,
            slug,
            summary: data.summary,
            content: data.content as unknown as Prisma.JsonValue,
            contentText,
            type: data.type,
            status: data.status,
            thumbnailUrl: data.thumbnailUrl,
            coverImage: data.coverImage,
            mediaUrls: this.extractMediaUrls(data.content),
            templateId: data.templateId,
            templateData: data.templateData as unknown as Prisma.JsonValue,
            tags: data.tags || [],
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
            publishedAt,
            productMentions: productConnections ? { create: productConnections } : undefined,
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
            productMentions: {
              select: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    discountPrice: true,
                    images: true,
                  },
                },
              },
            },
          },
        });

        // If analytics tracking is enabled, create post analytics entry
        await tx.postAnalytics.create({
          data: {
            postId: post.id,
            viewCount: 0,
            uniqueViewers: 0,
          },
        });

        return post;
      });

      // Format product mentions
      const productMentions = post.productMentions.map((mention) => ({
        productId: mention.product.id,
        name: mention.product.name,
        price: mention.product.price,
        discountPrice: mention.product.discountPrice,
        thumbnailUrl: mention.product.images.length > 0 ? mention.product.images[0] : null,
      }));

      // Transform post
      const postWithUser: PostWithUser = {
        ...post,
        content: post.content as unknown as ContentBlock[],
        templateData: post.templateData as any,
        productMentions,
      };

      // Remove prisma relation
      delete (postWithUser as any).productMentions;

      return postWithUser;
    } catch (error) {
      this.logger.error(`Error creating post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create post', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update a post
   */
  async updatePost(id: string, userId: string, data: UpdatePostDto): Promise<PostWithUser> {
    try {
      // Get existing post
      const existingPost = await this.prisma.post.findUnique({
        where: { id },
        select: {
          userId: true,
          title: true,
          status: true,
        },
      });

      if (!existingPost) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      if (existingPost.userId !== userId) {
        throw new AppError('You can only update your own posts', 403, 'FORBIDDEN');
      }

      // Prepare update data
      const updateData: any = { ...data };

      // Generate new slug if title changed
      if (data.title && data.title !== existingPost.title) {
        updateData.slug = await this.generateSlug(data.title);
      }

      // Extract content text if content updated
      if (data.content) {
        updateData.contentText = this.extractTextContent(data.content);
        updateData.mediaUrls = this.extractMediaUrls(data.content);
      }

      // If changing from draft to published
      if (data.status === PostStatus.PUBLISHED && existingPost.status !== PostStatus.PUBLISHED) {
        updateData.publishedAt = new Date();
      }

      // Update post in transaction to handle product mentions
      const post = await this.prisma.$transaction(async (tx) => {
        // If updating product mentions, first delete existing ones
        if (data.productIds !== undefined) {
          await tx.productMention.deleteMany({
            where: { postId: id },
          });

          // Create new product mentions
          if (data.productIds && data.productIds.length > 0) {
            await tx.productMention.createMany({
              data: data.productIds.map((productId) => ({
                postId: id,
                productId,
              })),
            });
          }
        }

        // Update the post
        const updatedPost = await tx.post.update({
          where: { id },
          data: {
            title: data.title,
            summary: data.summary,
            content: data.content as unknown as Prisma.JsonValue,
            contentText: updateData.contentText,
            type: data.type,
            status: data.status,
            thumbnailUrl: data.thumbnailUrl,
            coverImage: data.coverImage,
            mediaUrls: updateData.mediaUrls,
            templateId: data.templateId,
            templateData: data.templateData as unknown as Prisma.JsonValue,
            tags: data.tags,
            publishedAt: updateData.publishedAt,
            slug: updateData.slug,
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
            productMentions: {
              select: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    discountPrice: true,
                    images: true,
                  },
                },
              },
            },
          },
        });

        return updatedPost;
      });

      // Format product mentions
      const productMentions = post.productMentions.map((mention) => ({
        productId: mention.product.id,
        name: mention.product.name,
        price: mention.product.price,
        discountPrice: mention.product.discountPrice,
        thumbnailUrl: mention.product.images.length > 0 ? mention.product.images[0] : null,
      }));

      // Transform post
      const postWithUser: PostWithUser = {
        ...post,
        content: post.content as unknown as ContentBlock[],
        templateData: post.templateData as any,
        productMentions,
      };

      // Remove prisma relation
      delete (postWithUser as any).productMentions;

      return postWithUser;
    } catch (error) {
      this.logger.error(`Error updating post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update post', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Delete a post (soft delete)
   */
  async deletePost(id: string, userId: string): Promise<boolean> {
    try {
      // Check if post exists and belongs to user
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

      // Soft delete
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

  /**
   * Publish a draft post
   */
  async publishPost(id: string, userId: string): Promise<PostWithUser> {
    try {
      // Check if post exists and belongs to user
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

      // Update post to published
      const publishedPost = await this.prisma.post.update({
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
          productMentions: {
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  discountPrice: true,
                  images: true,
                },
              },
            },
          },
        },
      });

      // Format product mentions
      const productMentions = publishedPost.productMentions.map((mention) => ({
        productId: mention.product.id,
        name: mention.product.name,
        price: mention.product.price,
        discountPrice: mention.product.discountPrice,
        thumbnailUrl: mention.product.images.length > 0 ? mention.product.images[0] : null,
      }));

      // Transform post
      const postWithUser: PostWithUser = {
        ...publishedPost,
        content: publishedPost.content as unknown as ContentBlock[],
        templateData: publishedPost.templateData as any,
        productMentions,
      };

      // Remove prisma relation
      delete (postWithUser as any).productMentions;

      return postWithUser;
    } catch (error) {
      this.logger.error(`Error publishing post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to publish post', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Archive a post
   */
  async archivePost(id: string, userId: string): Promise<PostWithUser> {
    try {
      // Check if post exists and belongs to user
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

      // Update post to archived
      const archivedPost = await this.prisma.post.update({
        where: { id },
        data: {
          status: PostStatus.ARCHIVED,
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
          productMentions: {
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  discountPrice: true,
                  images: true,
                },
              },
            },
          },
        },
      });

      // Format product mentions
      const productMentions = archivedPost.productMentions.map((mention) => ({
        productId: mention.product.id,
        name: mention.product.name,
        price: mention.product.price,
        discountPrice: mention.product.discountPrice,
        thumbnailUrl: mention.product.images.length > 0 ? mention.product.images[0] : null,
      }));

      // Transform post
      const postWithUser: PostWithUser = {
        ...archivedPost,
        content: archivedPost.content as unknown as ContentBlock[],
        templateData: archivedPost.templateData as any,
        productMentions,
      };

      // Remove prisma relation
      delete (postWithUser as any).productMentions;

      return postWithUser;
    } catch (error) {
      this.logger.error(`Error archiving post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to archive post', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get posts with pagination and filtering
   */
  async getPosts(options: PostQueryOptions, requestUserId?: string): Promise<PostPaginationResult> {
    try {
      const {
        userId,
        type,
        status = PostStatus.PUBLISHED, // Default to published posts for public feed
        tag,
        search,
        sortBy = 'publishedAt',
        sortOrder = 'desc',
        includeLikeStatus = false,
        includeSaveStatus = false,
        page = 1,
        limit = 10,
      } = options;

      // Build where clause
      const where: Prisma.PostWhereInput = {};

      // Filter by user
      if (userId) {
        where.userId = userId;
      }

      // Filter by post type
      if (type) {
        if (Array.isArray(type)) {
          where.type = { in: type };
        } else {
          where.type = type;
        }
      }

      // Filter by status
      if (status) {
        if (Array.isArray(status)) {
          where.status = { in: status };
        } else {
          where.status = status;
        }
      } else {
        // Default exclude deleted posts
        where.status = { not: PostStatus.DELETED };
      }

      // Filter by tag
      if (tag) {
        where.tags = {
          has: tag,
        };
      }

      // Filter by search term
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { contentText: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ];
      }

      // Count total matching posts
      const total = await this.prisma.post.count({ where });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Build sort
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get posts
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
          productMentions: {
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  discountPrice: true,
                  images: true,
                },
              },
            },
          },
          likes:
            requestUserId && includeLikeStatus
              ? {
                  where: {
                    userId: requestUserId,
                    commentId: null,
                  },
                }
              : undefined,
          savedBy:
            requestUserId && includeSaveStatus
              ? {
                  where: {
                    userId: requestUserId,
                  },
                }
              : undefined,
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });

      // Transform posts
      const transformedPosts = posts.map((post) => {
        // Format product mentions
        const productMentions = post.productMentions.map((mention) => ({
          productId: mention.product.id,
          name: mention.product.name,
          price: mention.product.price,
          discountPrice: mention.product.discountPrice,
          thumbnailUrl: mention.product.images.length > 0 ? mention.product.images[0] : null,
        }));

        // Ensure comment count is accurate
        const commentsCount = post._count.comments;
        if (commentsCount !== post.commentCount) {
          // Update the post's comment count asynchronously (don't await)
          this.prisma.post
            .update({
              where: { id: post.id },
              data: { commentCount: commentsCount },
            })
            .catch((err) => {
              this.logger.error(`Failed to update post comment count: ${err}`);
            });
        }

        // Transform post
        const transformedPost: PostWithUser = {
          ...post,
          content: post.content as unknown as ContentBlock[],
          templateData: post.templateData as any,
          productMentions,
          commentCount: commentsCount, // Use accurate count
          liked: requestUserId && includeLikeStatus ? post.likes.length > 0 : undefined,
          saved: requestUserId && includeSaveStatus ? post.savedBy.length > 0 : undefined,
        };

        // Remove prisma relations
        delete (transformedPost as any).productMentions;
        delete (transformedPost as any).likes;
        delete (transformedPost as any).savedBy;
        delete (transformedPost as any)._count;

        return transformedPost;
      });

      return {
        data: transformedPosts,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting posts: ${error}`);
      throw new AppError('Failed to get posts', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get posts from followed users
   */
  async getFollowedPosts(
    userId: string,
    options: Omit<PostQueryOptions, 'followedOnly'> = {},
  ): Promise<PostPaginationResult> {
    try {
      // Get the list of users the current user follows
      const following = await this.prisma.follow.findMany({
        where: {
          followerId: userId,
          status: 'accepted',
        },
        select: {
          followingId: true,
        },
      });

      const followingIds = following.map((follow) => follow.followingId);

      if (followingIds.length === 0) {
        // Return empty result if user doesn't follow anyone
        return {
          data: [],
          meta: {
            total: 0,
            page: options.page || 1,
            limit: options.limit || 10,
            totalPages: 0,
          },
        };
      }

      // Extend options with followed users filter
      const extendedOptions: PostQueryOptions = {
        ...options,
        userId: undefined, // Override any user ID that might be in options
        status: options.status || PostStatus.PUBLISHED, // Default to published posts
      };

      // Build where clause based on extended options
      const where: Prisma.PostWhereInput = {
        userId: { in: followingIds },
        status: extendedOptions.status,
      };

      // Filter by post type
      if (extendedOptions.type) {
        if (Array.isArray(extendedOptions.type)) {
          where.type = { in: extendedOptions.type };
        } else {
          where.type = extendedOptions.type;
        }
      }

      // Filter by tag
      if (extendedOptions.tag) {
        where.tags = {
          has: extendedOptions.tag,
        };
      }

      // Filter by search term
      if (extendedOptions.search) {
        where.OR = [
          { title: { contains: extendedOptions.search, mode: 'insensitive' } },
          { summary: { contains: extendedOptions.search, mode: 'insensitive' } },
          { contentText: { contains: extendedOptions.search, mode: 'insensitive' } },
          { tags: { has: extendedOptions.search } },
        ];
      }

      // Count total matching posts
      const total = await this.prisma.post.count({ where });

      // Calculate pagination
      const page = extendedOptions.page || 1;
      const limit = extendedOptions.limit || 10;
      const totalPages = Math.ceil(total / limit);

      // Build sort
      const sortBy = extendedOptions.sortBy || 'publishedAt';
      const sortOrder = extendedOptions.sortOrder || 'desc';
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get posts
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
          productMentions: {
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  discountPrice: true,
                  images: true,
                },
              },
            },
          },
          likes: {
            where: {
              userId,
              commentId: null,
            },
          },
          savedBy: {
            where: {
              userId,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });

      // Transform posts
      const transformedPosts = posts.map((post) => {
        // Format product mentions
        const productMentions = post.productMentions.map((mention) => ({
          productId: mention.product.id,
          name: mention.product.name,
          price: mention.product.price,
          discountPrice: mention.product.discountPrice,
          thumbnailUrl: mention.product.images.length > 0 ? mention.product.images[0] : null,
        }));

        // Transform post
        const transformedPost: PostWithUser = {
          ...post,
          content: post.content as unknown as ContentBlock[],
          templateData: post.templateData as any,
          productMentions,
          liked: post.likes.length > 0,
          saved: post.savedBy.length > 0,
        };

        // Remove prisma relations
        delete (transformedPost as any).productMentions;
        delete (transformedPost as any).likes;
        delete (transformedPost as any).savedBy;

        return transformedPost;
      });

      return {
        data: transformedPosts,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting followed posts: ${error}`);
      throw new AppError('Failed to get followed posts', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get post status counts for a user
   */
  async getPostStatusCounts(userId: string): Promise<Record<string, number>> {
    try {
      const counts = await this.prisma.post.groupBy({
        by: ['status'],
        where: {
          userId,
          status: {
            in: [PostStatus.DRAFT, PostStatus.PUBLISHED, PostStatus.ARCHIVED],
          },
        },
        _count: {
          status: true,
        },
      });

      // Convert array of counts to object
      const result: Record<string, number> = {
        [PostStatus.DRAFT]: 0,
        [PostStatus.PUBLISHED]: 0,
        [PostStatus.ARCHIVED]: 0,
      };

      counts.forEach((count) => {
        result[count.status] = count._count.status;
      });

      return result;
    } catch (error) {
      this.logger.error(`Error getting post status counts: ${error}`);
      throw new AppError('Failed to get post status counts', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Increment post view count
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      // Update post's view count
      await this.prisma.post.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      // Also update analytics
      await this.prisma.postAnalytics.update({
        where: { postId: id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error incrementing view count: ${error}`);
      // Don't throw error for view count failures
    }
  }

  /**
   * Check if post belongs to user
   */
  async isPostOwner(id: string, userId: string): Promise<boolean> {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id },
        select: { userId: true },
      });

      return !!post && post.userId === userId;
    } catch (error) {
      this.logger.error(`Error checking post ownership: ${error}`);
      return false;
    }
  }

  /**
   * Generate a unique slug from title
   */
  async generateSlug(title: string): Promise<string> {
    // Convert title to slug format
    let baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/[\s_-]+/g, '-') // Replace spaces with hyphens
      .replace(/^-+|-+$/g, ''); // Trim hyphens from ends

    // Ensure slug is at least 3 chars long
    if (baseSlug.length < 3) {
      baseSlug = baseSlug + '-post';
    }

    // Check if slug already exists
    const existing = await this.prisma.post.findUnique({
      where: { slug: baseSlug },
    });

    if (!existing) {
      return baseSlug;
    }

    // If slug exists, add a random string
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${baseSlug}-${randomStr}`;
  }

  /**
   * Extract text content from structured content
   */
  extractTextContent(content: any[]): string {
    let text = '';

    // Process each content block
    for (const block of content) {
      switch (block.type) {
        case BlockType.PARAGRAPH:
          text += block.data.text + ' ';
          break;
        case BlockType.HEADING:
          text += block.data.text + ' ';
          break;
        case BlockType.QUOTE:
          text += block.data.text + ' ';
          if (block.data.author) {
            text += '- ' + block.data.author + ' ';
          }
          break;
        case BlockType.LIST:
          if (block.data.items && Array.isArray(block.data.items)) {
            block.data.items.forEach((item: string) => {
              text += item + ' ';
            });
          }
          break;
        // Skip non-text blocks
        case BlockType.IMAGE:
        case BlockType.GALLERY:
        case BlockType.VIDEO:
        case BlockType.PRODUCT:
        case BlockType.DIVIDER:
        case BlockType.HTML:
        case BlockType.EMBED:
          break;
      }
    }

    return text.trim();
  }

  /**
   * Extract media URLs from structured content
   */
  private extractMediaUrls(content: any[]): string[] {
    const urls: string[] = [];

    // Process each content block
    for (const block of content) {
      switch (block.type) {
        case BlockType.IMAGE:
          if (block.data.url) {
            urls.push(block.data.url);
          }
          break;
        case BlockType.GALLERY:
          if (block.data.images && Array.isArray(block.data.images)) {
            block.data.images.forEach((image: any) => {
              if (image.url) {
                urls.push(image.url);
              }
            });
          }
          break;
        case BlockType.VIDEO:
          if (block.data.url) {
            urls.push(block.data.url);
          }
          break;
      }
    }

    return urls;
  }
}
