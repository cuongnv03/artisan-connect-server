import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import {
  Post,
  PostWithUser,
  CreatePostDto,
  UpdatePostDto,
  PostQueryOptions,
  PostPaginationResult,
  ContentBlock,
} from '../models/Post';

export interface IPostRepository extends BaseRepository<Post, string> {
  findByIdWithUser(id: string, requestUserId?: string): Promise<PostWithUser | null>;
  findBySlugWithUser(slug: string, requestUserId?: string): Promise<PostWithUser | null>;
  createPost(userId: string, data: CreatePostDto): Promise<PostWithUser>;
  updatePost(id: string, userId: string, data: UpdatePostDto): Promise<PostWithUser>;
  deletePost(id: string, userId: string): Promise<boolean>;
  publishPost(id: string, userId: string): Promise<PostWithUser>;
  archivePost(id: string, userId: string): Promise<PostWithUser>;
  republishPost(id: string, userId: string): Promise<PostWithUser>;
  getPosts(options: PostQueryOptions, requestUserId?: string): Promise<PostPaginationResult>;
  getFollowedPosts(
    userId: string,
    options?: Omit<PostQueryOptions, 'followedOnly'>,
  ): Promise<PostPaginationResult>;
  incrementViewCount(id: string): Promise<void>;
  generateSlug(title: string): Promise<string>;
  getPostStatusCounts(userId: string): Promise<Record<string, number>>;
}
