import {
  Post,
  PostWithUser,
  CreatePostDto,
  UpdatePostDto,
  PostQueryOptions,
  PostPaginationResult,
} from '../models/Post';

export interface IPostService {
  createPost(userId: string, data: CreatePostDto): Promise<PostWithUser>;
  updatePost(id: string, userId: string, data: UpdatePostDto): Promise<PostWithUser>;
  getPostById(id: string, requestUserId?: string): Promise<PostWithUser | null>;
  getPostBySlug(slug: string, requestUserId?: string): Promise<PostWithUser | null>;
  deletePost(id: string, userId: string): Promise<boolean>;
  publishPost(id: string, userId: string): Promise<PostWithUser>;
  archivePost(id: string, userId: string): Promise<PostWithUser>;
  republishPost(id: string, userId: string): Promise<PostWithUser>;
  getPosts(options: PostQueryOptions, requestUserId?: string): Promise<PostPaginationResult>;
  getFollowedPosts(
    userId: string,
    options?: Omit<PostQueryOptions, 'followedOnly'>,
  ): Promise<PostPaginationResult>;
  getMyPosts(
    userId: string,
    options?: Omit<PostQueryOptions, 'userId'>,
  ): Promise<PostPaginationResult>;
  viewPost(id: string, userId?: string): Promise<void>;
  getPostStatusCounts(userId: string): Promise<Record<string, number>>;
}
