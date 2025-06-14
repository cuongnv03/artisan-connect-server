export interface UserAnalyticsDto {
  // Common stats for all users
  accountAge: number; // days since registration
  lastActiveDate: Date | null;

  // Customer specific
  totalOrders?: number;
  totalSpent?: number;
  averageOrderValue?: number;
  favoriteCategories?: Array<{ category: string; count: number }>;
  followingCount?: number;
  reviewsWritten?: number;

  // Artisan specific
  totalSales?: number;
  totalRevenue?: number;
  followerCount?: number;
  averageRating?: number;
  totalReviews?: number;
  totalProducts?: number;
  totalPosts?: number;
  engagementRate?: number;
}

export interface ArtisanBusinessAnalyticsDto {
  // Sales metrics
  salesMetrics: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    conversionRate: number;
  };

  // Time-based trends
  salesTrends: Array<{
    period: string; // "2024-01", "2024-W01", "2024-01-01"
    revenue: number;
    orders: number;
    customers: number;
  }>;

  // Product performance
  topProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    orderCount: number;
    averageRating: number;
  }>;

  // Customer insights
  customerMetrics: {
    totalCustomers: number;
    repeatCustomers: number;
    newCustomers: number;
    customerRetentionRate: number;
  };

  // Engagement metrics
  engagementMetrics: {
    followerGrowth: Array<{ period: string; count: number }>;
    postPerformance: {
      totalPosts: number;
      averageLikes: number;
      averageComments: number;
      totalViews: number;
    };
  };
}

export interface PlatformAnalyticsDto {
  // Overall platform metrics
  userMetrics: {
    totalUsers: number;
    totalArtisans: number;
    totalCustomers: number;
    activeUsers: number; // active in last 30 days
    newUsersThisMonth: number;
  };

  // Business metrics
  businessMetrics: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalProducts: number;
    totalCategories: number;
  };

  // Growth trends
  growthTrends: Array<{
    period: string;
    newUsers: number;
    newArtisans: number;
    revenue: number;
    orders: number;
  }>;

  // Top performers
  topArtisans: Array<{
    id: string;
    shopName: string;
    revenue: number;
    rating: number;
    followerCount: number;
  }>;

  topProducts: Array<{
    id: string;
    name: string;
    artisanName: string;
    revenue: number;
    viewCount: number;
  }>;
}

export interface AnalyticsTimeRange {
  startDate: Date;
  endDate: Date;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
}
