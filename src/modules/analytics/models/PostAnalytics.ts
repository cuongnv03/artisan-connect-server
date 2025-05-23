/**
 * PostAnalytics entity
 */
export interface PostAnalytics {
  id: string;
  postId: string;
  viewCount: number;
  uniqueViewers: number;
  avgReadTime: number | null;
  conversionCount: number;
  updatedAt: Date;
}

/**
 * Post insights DTO
 */
export interface PostInsightsDto {
  analytics: PostAnalytics;
  trendData: {
    date: string;
    views: number;
    uniqueViews: number;
  }[];
  performanceMetrics: {
    avgReadTime: number | null;
    conversionRate: number;
    engagementRate: number;
  };
  interactionData: {
    likes: number;
    comments: number;
    saves: number;
  };
}

/**
 * Track view event DTO
 */
export interface TrackViewEventDto {
  postId: string;
  userId?: string;
  sessionId: string;
  referrer?: string;
  timeSpent?: number;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Analytics summary DTO
 */
export interface AnalyticsSummaryDto {
  totalPosts: number;
  totalViews: number;
  totalUniqueViewers: number;
  totalConversions: number;
  avgReadTime: number | null;
  topPerformingPosts: {
    postId: string;
    title: string;
    viewCount: number;
    conversionCount: number;
  }[];
}

/**
 * Trending post data
 */
export interface TrendingPostData {
  postId: string;
  title: string;
  slug: string | null;
  viewCount: number;
  uniqueViewers: number;
  conversionCount: number;
  growthRate: number;
  publishedAt: Date | null;
}
