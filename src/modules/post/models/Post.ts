/**
 * Post type enum
 */
export enum PostType {
  STORY = 'STORY', // Chi tiết hành trình nghệ nhân
  TUTORIAL = 'TUTORIAL', // Hướng dẫn
  PRODUCT_SHOWCASE = 'PRODUCT_SHOWCASE', // Giới thiệu sản phẩm
  BEHIND_THE_SCENES = 'BEHIND_THE_SCENES', // Hậu trường/quy trình
  EVENT = 'EVENT', // Sự kiện
}

/**
 * Post status enum
 */
export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

/**
 * Block type for structured content
 */
export enum BlockType {
  PARAGRAPH = 'paragraph',
  HEADING = 'heading',
  IMAGE = 'image',
  GALLERY = 'gallery',
  VIDEO = 'video',
  QUOTE = 'quote',
  LIST = 'list',
  PRODUCT = 'product',
  DIVIDER = 'divider',
  HTML = 'html',
  EMBED = 'embed',
}

/**
 * Content block interface
 */
export interface ContentBlock {
  id: string;
  type: BlockType;
  data: any;
}

/**
 * Post entity
 */
export interface Post {
  id: string;
  userId: string;
  title: string;
  slug?: string | null;
  summary?: string | null;
  content: ContentBlock[];
  contentText?: string | null;
  type: PostType;
  status: PostStatus;
  thumbnailUrl?: string | null;
  coverImage?: string | null;
  mediaUrls: string[];
  templateId?: string | null;
  templateData?: any;
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Post with user details
 */
export interface PostWithUser extends Post {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    artisanProfile?: {
      shopName: string;
      isVerified: boolean;
    } | null;
  };
  productMentions?: {
    productId: string;
    name: string;
    price: number;
    discountPrice?: number | null;
    thumbnailUrl?: string | null;
  }[];
  liked?: boolean; // If the requesting user has liked the post
  saved?: boolean; // If the requesting user has saved the post
}

/**
 * Create post DTO
 */
export interface CreatePostDto {
  title: string;
  summary?: string;
  content: ContentBlock[];
  type: PostType;
  status: PostStatus;
  thumbnailUrl?: string;
  coverImage?: string;
  tags?: string[];
  productIds?: string[]; // Products to mention/tag in the post
  templateId?: string;
  templateData?: any;
  publishNow?: boolean; // Whether to publish immediately
}

/**
 * Update post DTO
 */
export interface UpdatePostDto {
  title?: string;
  summary?: string;
  content?: ContentBlock[];
  type?: PostType;
  status?: PostStatus;
  thumbnailUrl?: string;
  coverImage?: string;
  tags?: string[];
  productIds?: string[];
  templateId?: string;
  templateData?: any;
}

/**
 * Post query options
 */
export interface PostQueryOptions {
  userId?: string; // Posts by specific user
  type?: PostType | PostType[]; // Posts of specific type
  status?: PostStatus | PostStatus[]; // Posts with specific status
  tag?: string; // Posts with specific tag
  search?: string; // Search in title, summary, or content
  sortBy?: 'createdAt' | 'publishedAt' | 'viewCount' | 'likeCount' | 'commentCount';
  sortOrder?: 'asc' | 'desc';
  includeLikeStatus?: boolean; // Include whether requesting user liked the posts
  includeSaveStatus?: boolean; // Include whether requesting user saved the posts
  followedOnly?: boolean; // Only posts from users the requesting user follows
  page?: number;
  limit?: number;
}

/**
 * Post pagination result
 */
export interface PostPaginationResult {
  data: PostWithUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
