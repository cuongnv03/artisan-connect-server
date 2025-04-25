import { BaseRepository } from '../../../../shared/interfaces/BaseRepository';
import {
  Post,
  PostWithUser,
  CreatePostDto,
  UpdatePostDto,
  PostQueryOptions,
  PostPaginationResult,
} from '../entities/Post';

export interface IPostRepository extends BaseRepository<Post, string> {
  /**
   * Find post by ID with user details
   */
  findByIdWithUser(id: string, requestUserId?: string): Promise<PostWithUser | null>;

  /**
   * Find post by slug with user details
   */
  findBySlugWithUser(slug: string, requestUserId?: string): Promise<PostWithUser | null>;

  /**
   * Create a new post
   */
  createPost(userId: string, data: CreatePostDto): Promise<PostWithUser>;

  /**
   * Update a post
   */
  updatePost(id: string, userId: string, data: UpdatePostDto): Promise<PostWithUser>;

  /**
   * Delete a post (soft delete)
   */
  deletePost(id: string, userId: string): Promise<boolean>;

  /**
   * Publish a draft post
   */
  publishPost(id: string, userId: string): Promise<PostWithUser>;

  /**
   * Archive a post
   */
  archivePost(id: string, userId: string): Promise<PostWithUser>;

  /**
   * Get posts with pagination and filtering
   */
  getPosts(options: PostQueryOptions, requestUserId?: string): Promise<PostPaginationResult>;

  /**
   * Get posts from followed users
   */
  getFollowedPosts(
    userId: string,
    options?: Omit<PostQueryOptions, 'followedOnly'>,
  ): Promise<PostPaginationResult>;

  /**
   * Get post status counts for a user (drafts, published, archived)
   */
  getPostStatusCounts(userId: string): Promise<Record<string, number>>;

  /**
   * Increment post view count
   */
  incrementViewCount(id: string): Promise<void>;

  /**
   * Check if post belongs to user
   */
  isPostOwner(id: string, userId: string): Promise<boolean>;

  /**
   * Generate a unique slug from title
   */
  generateSlug(title: string): Promise<string>;

  /**
   * Extract text content from structured content
   */
  extractTextContent(content: any[]): string;
}
