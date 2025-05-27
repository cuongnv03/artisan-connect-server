export enum PostType {
  STORY = 'STORY',
  TUTORIAL = 'TUTORIAL',
  PRODUCT_SHOWCASE = 'PRODUCT_SHOWCASE',
  BEHIND_THE_SCENES = 'BEHIND_THE_SCENES',
  EVENT = 'EVENT',
  GENERAL = 'GENERAL',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

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

export interface ContentBlock {
  id: string;
  type: BlockType;
  data: any;
  order: number;
}

export interface Post {
  id: string;
  userId: string;
  title: string;
  slug?: string;
  summary?: string;
  content: ContentBlock[];
  contentText?: string; // For search
  type: PostType;
  status: PostStatus;
  thumbnailUrl?: string;
  coverImage?: string;
  mediaUrls: string[];
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface PostWithUser extends Post {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    artisanProfile?: {
      shopName: string;
      isVerified: boolean;
    };
  };
  isLiked?: boolean;
  isSaved?: boolean;
  canEdit?: boolean;
}

export interface CreatePostDto {
  title: string;
  summary?: string;
  content: ContentBlock[];
  type: PostType;
  status?: PostStatus;
  thumbnailUrl?: string;
  coverImage?: string;
  tags?: string[];
  publishNow?: boolean;
  productMentions?: Array<{
    productId: string;
    contextText?: string;
    position: number;
  }>;
}

export interface UpdatePostDto {
  title?: string;
  summary?: string;
  content?: ContentBlock[];
  type?: PostType;
  status?: PostStatus;
  thumbnailUrl?: string;
  coverImage?: string;
  tags?: string[];
  productMentions?: Array<{
    productId: string;
    contextText?: string;
    position: number;
  }>;
}

export interface PostQueryOptions {
  userId?: string;
  type?: PostType | PostType[];
  status?: PostStatus | PostStatus[];
  tags?: string[];
  search?: string;
  followedOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'publishedAt' | 'viewCount' | 'likeCount' | 'commentCount';
  sortOrder?: 'asc' | 'desc';
}

export interface PostPaginationResult {
  data: PostWithUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
