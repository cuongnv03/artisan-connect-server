export interface UserActivity {
  id: string;
  userId: string;
  activityType: string;
  entityId?: string | null;
  entityType?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export interface CreateUserActivityDto {
  userId: string;
  activityType: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PROFILE_VIEW = 'profile_view',
  POST_VIEW = 'post_view',
  PRODUCT_VIEW = 'product_view',
  FOLLOW = 'follow',
  UNFOLLOW = 'unfollow',
  LIKE_POST = 'like_post',
  COMMENT_POST = 'comment_post',
  SHARE_POST = 'share_post',
  ADD_TO_CART = 'add_to_cart',
  PURCHASE = 'purchase',
  SEARCH = 'search',
}
