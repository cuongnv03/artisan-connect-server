import {
  Post,
  PostWithUser,
  CreatePostDto,
  UpdatePostDto,
  PostQueryOptions,
  PostPaginationResult,
} from '../domain/entities/Post';

export interface IPostService {
  /**
   * Create a new post
   */
  createPost(userId: string, data: CreatePostDto): Promise<PostWithUser>;

  /**
   * Update a post
   */
  updatePost(id: string, userId: string, data: UpdatePostDto): Promise<PostWithUser>;

  /**
   * Get post by ID
   */
  getPostById(id: string, requestUserId?: string): Promise<PostWithUser | null>;

  /**
   * Get post by slug
   */
  getPostBySlug(slug: string, requestUserId?: string): Promise<PostWithUser | null>;

  /**
   * Delete a post
   */
  deletePost(id: string, userId: string): Promise<boolean>;

  /**
   * Publish a draft post
   */
  publishPost(id: string, userId: string): Promise<PostWithUser>;

  /**
   * Archive a published post
   */
  archivePost(id: string, userId: string): Promise<PostWithUser>;

  /**
   * Get posts with filtering and pagination
   */
  getPosts(options: PostQueryOptions, requestUserId?: string): Promise<PostPaginationResult>;

  /**
   * Get posts from users that the current user follows
   */
  getFollowedPosts(
    userId: string,
    options?: Omit<PostQueryOptions, 'followedOnly'>,
  ): Promise<PostPaginationResult>;

  /**
   * Get my posts as a creator (with drafts, etc.)
   */
  getMyPosts(
    userId: string,
    options?: Omit<PostQueryOptions, 'userId'>,
  ): Promise<PostPaginationResult>;

  /**
   * View a post (increment view count)
   */
  viewPost(id: string, userId?: string): Promise<void>;

  /**
   * Get post status counts for a user
   */
  getPostStatusCounts(userId: string): Promise<Record<string, number>>;
}
