/**
 * PostAnalytics entity
 */
export interface PostAnalytics {
  id: string;
  postId: string;
  viewCount: number;
  uniqueViewers: number;
  avgReadTime: number | null;
  bounceRate: number | null;
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
  }[];
  demographicData?: {
    ageGroups?: Record<string, number>;
    locations?: Record<string, number>;
  };
  interactionData: {
    likes: number;
    comments: number;
    shares: number;
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
}
