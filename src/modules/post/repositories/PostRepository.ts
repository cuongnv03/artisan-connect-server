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
  ContentBlock,
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
          // Include product mentions with full product details
          productMentions: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                  price: true,
                  discountPrice: true,
                  status: true,
                  avgRating: true,
                  reviewCount: true,
                  seller: {
                    select: {
                      id: true,
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
              },
            },
            orderBy: {
              position: 'asc',
            },
          },
          // Check if current user liked this post
          likes: requestUserId
            ? {
                where: { userId: requestUserId, commentId: null },
              }
            : undefined,
          // Check if current user saved this post to wishlist
          wishlistItems: requestUserId
            ? {
                where: { userId: requestUserId, itemType: 'POST' },
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
          // Include product mentions with full product details
          productMentions: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                  price: true,
                  discountPrice: true,
                  status: true,
                  avgRating: true,
                  reviewCount: true,
                  seller: {
                    select: {
                      id: true,
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
              },
            },
            orderBy: {
              position: 'asc',
            },
          },
          likes: requestUserId
            ? {
                where: { userId: requestUserId, commentId: null },
              }
            : undefined,
          wishlistItems: requestUserId
            ? {
                where: { userId: requestUserId, itemType: 'POST' },
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

      // Clean and validate content blocks structure
      const cleanedContent = (data.content || []).map((block, index) => ({
        id: block.id || `block_${Date.now()}_${index}`,
        type: block.type,
        data: block.data || {},
        order: block.order !== undefined ? block.order : index,
      }));

      // Combine media from content blocks AND additional media files
      const contentMediaUrls = this.extractMediaUrls(cleanedContent);
      const allMediaUrls = [...contentMediaUrls, ...(data.mediaUrls || [])];

      const post = await this.prisma.$transaction(async (tx) => {
        // Create the main post record
        const newPost = await tx.post.create({
          data: {
            userId,
            title: data.title,
            slug,
            summary: data.summary,
            content: cleanedContent as any,
            contentText,
            type: data.type,
            status: data.publishNow ? PostStatus.PUBLISHED : data.status || PostStatus.DRAFT,
            thumbnailUrl: data.thumbnailUrl,
            coverImage: data.coverImage,
            mediaUrls: allMediaUrls, // Sử dụng combined media URLs
            tags: data.tags || [],
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
            publishedAt: data.publishNow ? new Date() : null,
          },
        });

        // Create product mentions if provided
        if (data.productMentions && data.productMentions.length > 0) {
          await Promise.all(
            data.productMentions.map((mention) =>
              tx.postProductMention.create({
                data: {
                  postId: newPost.id,
                  productId: mention.productId,
                  contextText: mention.contextText,
                  position: mention.position,
                },
              }),
            ),
          );
        }

        return newPost;
      });

      return (await this.findByIdWithUser(post.id, userId)) as PostWithUser;
    } catch (error) {
      this.logger.error(`Error creating post: ${error}`);
      throw new AppError('Failed to create post', 500, 'DATABASE_ERROR');
    }
  }

  async updatePost(id: string, userId: string, data: UpdatePostDto): Promise<PostWithUser> {
    try {
      // Verify post ownership
      const existingPost = await this.prisma.post.findUnique({
        where: { id },
        select: { userId: true, title: true, mediaUrls: true }, // THÊM: mediaUrls
      });

      if (!existingPost) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      if (existingPost.userId !== userId) {
        throw new AppError('You can only update your own posts', 403, 'FORBIDDEN');
      }

      const updateData: any = { ...data };
      delete updateData.productMentions;

      // Generate new slug if title changed
      if (data.title && data.title !== existingPost.title) {
        updateData.slug = await this.generateSlug(data.title);
      }

      // Process content blocks and media URLs
      if (data.content || data.mediaUrls) {
        const cleanedContent = data.content
          ? data.content.map((block, index) => ({
              id: block.id || `block_${Date.now()}_${index}`,
              type: block.type,
              data: block.data || {},
              order: block.order !== undefined ? block.order : index,
            }))
          : undefined;

        if (cleanedContent) {
          updateData.content = { blocks: cleanedContent };
          updateData.contentText = this.extractTextContent(cleanedContent);

          // Combine content media with additional media
          const contentMediaUrls = this.extractMediaUrls(cleanedContent);
          const additionalMediaUrls = data.mediaUrls || [];
          const existingMediaUrls = existingPost.mediaUrls || [];

          // Keep existing media URLs and add new ones
          updateData.mediaUrls = [...new Set([...contentMediaUrls, ...additionalMediaUrls])];
        } else if (data.mediaUrls) {
          // Only updating media URLs without content
          const existingMediaUrls = existingPost.mediaUrls || [];
          updateData.mediaUrls = [...new Set([...existingMediaUrls, ...data.mediaUrls])];
        }
      }

      // Use transaction for atomic updates
      const result = await this.prisma.$transaction(async (tx) => {
        const updatedPost = await tx.post.update({
          where: { id },
          data: updateData,
        });

        // Handle product mentions separately
        if (data.productMentions !== undefined) {
          await tx.postProductMention.deleteMany({
            where: { postId: id },
          });

          if (data.productMentions.length > 0) {
            await tx.postProductMention.createMany({
              data: data.productMentions.map((mention) => ({
                postId: id,
                productId: mention.productId,
                contextText: mention.contextText,
                position: mention.position,
              })),
            });
          }
        }

        return updatedPost;
      });

      return (await this.findByIdWithUser(id, userId)) as PostWithUser;
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

      // Soft delete by updating status and setting deletedAt timestamp
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

  async republishPost(id: string, userId: string): Promise<PostWithUser> {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id },
        select: { userId: true, status: true },
      });

      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      if (post.userId !== userId) {
        throw new AppError('You can only republish your own posts', 403, 'FORBIDDEN');
      }

      if (post.status !== PostStatus.ARCHIVED) {
        throw new AppError('Only archived posts can be republished', 400, 'INVALID_OPERATION');
      }

      const updatedPost = await this.prisma.post.update({
        where: { id },
        data: {
          status: PostStatus.PUBLISHED,
          publishedAt: new Date(), // Set new publish date
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
      this.logger.error(`Error republishing post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to republish post', 500, 'DATABASE_ERROR');
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

      // Enhanced search across multiple fields including extracted content text
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { contentText: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ];
      }

      // Filter posts from followed users only
      if (followedOnly && requestUserId) {
        const followedUsers = await this.prisma.follow.findMany({
          where: { followerId: requestUserId },
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
          wishlistItems: requestUserId
            ? {
                where: { userId: requestUserId, itemType: 'POST' },
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

  async incrementViewCount(id: string, userId?: string): Promise<void> {
    try {
      // Nếu có userId, check xem có phải author không
      if (userId) {
        const post = await this.prisma.post.findUnique({
          where: { id },
          select: { userId: true },
        });

        // Không tăng view nếu là author
        if (post && post.userId === userId) {
          return;
        }
      }

      await this.prisma.post.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });

      this.logger.debug(`View count incremented for post ${id} by user ${userId || 'anonymous'}`);
    } catch (error) {
      this.logger.error(`Error incrementing view count: ${error}`);
      // Don't throw error for view count updates as they are non-critical
    }
  }

  async generateSlug(title: string): Promise<string> {
    // Convert title to URL-friendly slug
    let baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (baseSlug.length < 3) {
      baseSlug = baseSlug + '-post';
    }

    // Check if slug already exists
    const existing = await this.prisma.post.findUnique({
      where: { slug: baseSlug },
    });

    if (!existing) return baseSlug;

    // Generate unique slug by appending random string
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${baseSlug}-${randomStr}`;
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

      // Initialize all possible statuses with zero count
      const result: Record<string, number> = {
        [PostStatus.DRAFT]: 0,
        [PostStatus.PUBLISHED]: 0,
        [PostStatus.ARCHIVED]: 0,
      };

      // Populate actual counts from database
      counts.forEach((count) => {
        result[count.status] = count._count.status;
      });

      return result;
    } catch (error) {
      this.logger.error(`Error getting post status counts: ${error}`);
      throw new AppError('Failed to get post status counts', 500, 'DATABASE_ERROR');
    }
  }

  // Extract plain text from content blocks for search functionality
  private extractTextContent(content: ContentBlock[]): string {
    let text = '';

    for (const block of content) {
      if (block.data) {
        switch (block.type) {
          case 'paragraph':
          case 'heading':
            if (block.data.text) text += block.data.text + ' ';
            break;
          case 'quote':
            if (block.data.text) text += block.data.text + ' ';
            if (block.data.author) text += '- ' + block.data.author + ' ';
            break;
          case 'list':
            if (block.data.items && Array.isArray(block.data.items)) {
              block.data.items.forEach((item: string) => (text += item + ' '));
            }
            break;
          case 'product':
            if (block.data.name) text += block.data.name + ' ';
            if (block.data.description) text += block.data.description + ' ';
            break;
        }
      }
    }

    return text.trim();
  }

  // Extract media URLs from content blocks for efficient querying
  private extractMediaUrls(content: ContentBlock[]): string[] {
    const urls: string[] = [];

    for (const block of content) {
      if (block.data) {
        switch (block.type) {
          case 'image':
            if (block.data.url) urls.push(block.data.url);
            break;
          case 'gallery':
            if (block.data.images && Array.isArray(block.data.images)) {
              block.data.images.forEach((img: any) => {
                if (img.url) urls.push(img.url);
              });
            }
            break;
          case 'video':
            if (block.data.url) urls.push(block.data.url);
            break;
        }
      }
    }

    return urls;
  }

  // Transform database result to include computed fields and user permissions
  private transformPostWithUser(post: any, requestUserId?: string): PostWithUser {
    const { likes, wishlistItems, productMentions, ...postData } = post;

    // Fix content parsing - extract blocks from the JSON structure
    let processedContent: ContentBlock[] = [];
    if (postData.content) {
      if (Array.isArray(postData.content)) {
        // Already an array of blocks
        processedContent = postData.content;
      } else if (postData.content.blocks && Array.isArray(postData.content.blocks)) {
        // Extract blocks from {blocks: [...]} structure
        processedContent = postData.content.blocks;
      } else if (typeof postData.content === 'string') {
        // Parse JSON string if needed
        try {
          const parsed = JSON.parse(postData.content);
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            processedContent = parsed.blocks;
          } else if (Array.isArray(parsed)) {
            processedContent = parsed;
          }
        } catch (error) {
          console.warn('Failed to parse post content JSON:', error);
          processedContent = [];
        }
      }
    }

    return {
      ...postData,
      content: processedContent,
      productMentions: productMentions || [],
      isLiked: requestUserId ? likes?.length > 0 : undefined,
      isSaved: requestUserId ? wishlistItems?.length > 0 : undefined,
      canEdit: requestUserId ? postData.userId === requestUserId : false,
    };
  }
}
