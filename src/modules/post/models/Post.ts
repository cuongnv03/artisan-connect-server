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

export interface PostProductMention {
  id: string;
  postId: string;
  productId: string;
  contextText?: string | null;
  position?: number | null;
  product: {
    id: string;
    name: string;
    slug?: string | null;
    images: string[];
    price: number;
    discountPrice?: number | null;
    status: string;
    avgRating?: number | null;
    reviewCount: number;
    seller: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string | null;
      artisanProfile?: {
        shopName: string;
        isVerified: boolean;
      } | null;
    };
  };
}

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
  productMentions?: PostProductMention[];
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
    position?: number;
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
    position?: number;
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
