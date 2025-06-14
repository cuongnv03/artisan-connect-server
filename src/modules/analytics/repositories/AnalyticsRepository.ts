import { PrismaClient } from '@prisma/client';
import { IAnalyticsRepository } from './AnalyticsRepository.interface';
import {
  UserAnalyticsDto,
  ArtisanBusinessAnalyticsDto,
  PlatformAnalyticsDto,
  AnalyticsTimeRange,
} from '../models/AnalyticsDto';
import { Logger } from '../../../core/logging/Logger';
import { AppError } from '../../../core/errors/AppError';

export class AnalyticsRepository implements IAnalyticsRepository {
  private logger = Logger.getInstance();

  constructor(private prisma: PrismaClient) {}

  async getUserAnalytics(userId: string): Promise<UserAnalyticsDto> {
    try {
      // Get user basic info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          artisanProfile: true,
        },
      });

      if (!user) {
        throw AppError.notFound('User not found');
      }

      const accountAge = Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      const baseAnalytics: UserAnalyticsDto = {
        accountAge,
        lastActiveDate: user.lastSeenAt,
      };

      if (user.role === 'CUSTOMER') {
        // Customer analytics
        const [orderStats, reviewCount] = await Promise.all([
          this.prisma.order.aggregate({
            where: { userId },
            _count: { id: true },
            _sum: { totalAmount: true },
            _avg: { totalAmount: true },
          }),
          this.prisma.review.count({
            where: { userId },
          }),
        ]);

        // Favorite categories (based on order history)
        const favoriteCategories = await this.prisma.$queryRaw<
          Array<{ category: string; count: bigint }>
        >`
          SELECT c.name as category, COUNT(*) as count
          FROM "Order" o
          JOIN "OrderItem" oi ON o.id = oi."orderId"
          JOIN "Product" p ON oi."productId" = p.id
          JOIN "CategoryProduct" cp ON p.id = cp."productId"
          JOIN "Category" c ON cp."categoryId" = c.id
          WHERE o."userId" = ${userId}
          GROUP BY c.name
          ORDER BY count DESC
          LIMIT 5
        `;

        return {
          ...baseAnalytics,
          totalOrders: orderStats._count.id,
          totalSpent: Number(orderStats._sum.totalAmount || 0),
          averageOrderValue: Number(orderStats._avg.totalAmount || 0),
          followingCount: user.followingCount,
          reviewsWritten: reviewCount,
          favoriteCategories: favoriteCategories.map((cat) => ({
            category: cat.category,
            count: Number(cat.count),
          })),
        };
      } else if (user.role === 'ARTISAN') {
        // Artisan analytics
        const [salesStats, productCount, postCount, reviewStats] = await Promise.all([
          this.prisma.orderItem.aggregate({
            where: { sellerId: userId },
            _count: { id: true },
            _sum: { price: true },
          }),
          this.prisma.product.count({
            where: { sellerId: userId },
          }),
          this.prisma.post.count({
            where: { userId },
          }),
          this.prisma.review.aggregate({
            where: {
              product: { sellerId: userId },
            },
            _avg: { rating: true },
            _count: { id: true },
          }),
        ]);

        // Calculate engagement rate
        const postsWithEngagement = await this.prisma.post.aggregate({
          where: { userId },
          _sum: {
            likeCount: true,
            commentCount: true,
            viewCount: true,
          },
        });

        const totalEngagement =
          (postsWithEngagement._sum.likeCount || 0) + (postsWithEngagement._sum.commentCount || 0);
        const totalViews = postsWithEngagement._sum.viewCount || 0;
        const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

        return {
          ...baseAnalytics,
          totalSales: salesStats._count.id,
          totalRevenue: Number(salesStats._sum.price || 0),
          followerCount: user.followerCount,
          averageRating: Number(reviewStats._avg.rating || 0),
          totalReviews: reviewStats._count.id,
          totalProducts: productCount,
          totalPosts: postCount,
          engagementRate: Number(engagementRate.toFixed(2)),
        };
      }

      return baseAnalytics;
    } catch (error) {
      this.logger.error(`Error getting user analytics: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get user analytics');
    }
  }

  async getArtisanBusinessAnalytics(
    artisanId: string,
    timeRange: AnalyticsTimeRange,
  ): Promise<ArtisanBusinessAnalyticsDto> {
    try {
      // Verify artisan exists
      const artisan = await this.prisma.user.findFirst({
        where: { id: artisanId, role: 'ARTISAN' },
      });

      if (!artisan) {
        throw AppError.notFound('Artisan not found');
      }

      // Sales metrics
      const salesMetrics = await this.getSalesMetrics(artisanId, timeRange);

      // Sales trends
      const salesTrends = await this.getSalesTrends(artisanId, timeRange);

      // Top products
      const topProducts = await this.getTopProducts(artisanId, 10);

      // Customer metrics
      const customerMetrics = await this.getCustomerMetrics(artisanId);

      // Engagement metrics
      const engagementMetrics = await this.getEngagementMetrics(artisanId, timeRange);

      return {
        salesMetrics,
        salesTrends,
        topProducts,
        customerMetrics,
        engagementMetrics,
      };
    } catch (error) {
      this.logger.error(`Error getting artisan business analytics: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get artisan business analytics');
    }
  }

  async getPlatformAnalytics(timeRange: AnalyticsTimeRange): Promise<PlatformAnalyticsDto> {
    try {
      // User metrics
      const userMetrics = await this.getUserMetrics();

      // Business metrics
      const businessMetrics = await this.getBusinessMetrics();

      // Growth trends
      const growthTrends = await this.getGrowthTrends(timeRange);

      // Top performers
      const [topArtisans, topProducts] = await Promise.all([
        this.getTopArtisans(10),
        this.getTopProductsGlobal(10),
      ]);

      return {
        userMetrics,
        businessMetrics,
        growthTrends,
        topArtisans,
        topProducts,
      };
    } catch (error) {
      this.logger.error(`Error getting platform analytics: ${error}`);
      throw AppError.internal('Failed to get platform analytics');
    }
  }

  // Helper methods
  private async getSalesMetrics(artisanId: string, timeRange: AnalyticsTimeRange) {
    const orderItems = await this.prisma.orderItem.aggregate({
      where: {
        sellerId: artisanId,
        order: {
          createdAt: {
            gte: timeRange.startDate,
            lte: timeRange.endDate,
          },
        },
      },
      _count: { id: true },
      _sum: { price: true },
    });

    const totalProducts = await this.prisma.product.count({
      where: { sellerId: artisanId },
    });

    const totalViews = await this.prisma.product.aggregate({
      where: { sellerId: artisanId },
      _sum: { viewCount: true },
    });

    const conversionRate = totalViews._sum.viewCount
      ? (orderItems._count.id / totalViews._sum.viewCount) * 100
      : 0;

    return {
      totalRevenue: Number(orderItems._sum.price || 0),
      totalOrders: orderItems._count.id,
      averageOrderValue:
        orderItems._count.id > 0 ? Number(orderItems._sum.price || 0) / orderItems._count.id : 0,
      conversionRate: Number(conversionRate.toFixed(2)),
    };
  }

  async getSalesTrends(
    artisanId: string,
    timeRange: AnalyticsTimeRange,
  ): Promise<Array<{ period: string; revenue: number; orders: number; customers: number }>> {
    const groupByClause = this.getGroupByClause(timeRange.period);

    const trends = await this.prisma.$queryRaw<
      Array<{
        period: string;
        revenue: number;
        orders: bigint;
        customers: bigint;
      }>
    >`
      SELECT 
        ${groupByClause} as period,
        COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
        COUNT(DISTINCT o.id) as orders,
        COUNT(DISTINCT o."userId") as customers
      FROM "Order" o
      JOIN "OrderItem" oi ON o.id = oi."orderId"
      WHERE oi."sellerId" = ${artisanId}
        AND o."createdAt" >= ${timeRange.startDate}
        AND o."createdAt" <= ${timeRange.endDate}
      GROUP BY ${groupByClause}
      ORDER BY period ASC
    `;

    return trends.map((trend) => ({
      period: trend.period,
      revenue: Number(trend.revenue),
      orders: Number(trend.orders),
      customers: Number(trend.customers),
    }));
  }

  async getFollowerGrowth(
    artisanId: string,
    timeRange: AnalyticsTimeRange,
  ): Promise<Array<{ period: string; count: number }>> {
    const groupByClause = this.getGroupByClause(timeRange.period);

    const growth = await this.prisma.$queryRaw<
      Array<{
        period: string;
        count: bigint;
      }>
    >`
      SELECT 
        ${groupByClause} as period,
        COUNT(*) as count
      FROM "Follow"
      WHERE "followingId" = ${artisanId}
        AND "createdAt" >= ${timeRange.startDate}
        AND "createdAt" <= ${timeRange.endDate}
      GROUP BY ${groupByClause}
      ORDER BY period ASC
    `;

    return growth.map((g) => ({
      period: g.period,
      count: Number(g.count),
    }));
  }

  async getTopProducts(
    artisanId: string,
    limit: number,
  ): Promise<
    Array<{ id: string; name: string; revenue: number; orderCount: number; averageRating: number }>
  > {
    const products = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        revenue: number;
        orderCount: bigint;
        averageRating: number;
      }>
    >`
      SELECT 
        p.id,
        p.name,
        COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
        COUNT(oi.id) as "orderCount",
        COALESCE(AVG(r.rating), 0) as "averageRating"
      FROM "Product" p
      LEFT JOIN "OrderItem" oi ON p.id = oi."productId"
      LEFT JOIN "Review" r ON p.id = r."productId"
      WHERE p."sellerId" = ${artisanId}
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      revenue: Number(p.revenue),
      orderCount: Number(p.orderCount),
      averageRating: Number(p.averageRating || 0),
    }));
  }

  async getCustomerInsights(artisanId: string): Promise<{
    totalCustomers: number;
    repeatCustomers: number;
    newCustomers: number;
    customerRetentionRate: number;
  }> {
    const customerData = await this.prisma.$queryRaw<
      Array<{
        totalCustomers: bigint;
        repeatCustomers: bigint;
      }>
    >`
      WITH customer_orders AS (
        SELECT 
          o."userId",
          COUNT(*) as order_count
        FROM "Order" o
        JOIN "OrderItem" oi ON o.id = oi."orderId"
        WHERE oi."sellerId" = ${artisanId}
        GROUP BY o."userId"
      )
      SELECT 
        COUNT(*) as "totalCustomers",
        COUNT(CASE WHEN order_count > 1 THEN 1 END) as "repeatCustomers"
      FROM customer_orders
    `;

    const result = customerData[0];
    const totalCustomers = Number(result?.totalCustomers || 0);
    const repeatCustomers = Number(result?.repeatCustomers || 0);
    const customerRetentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // New customers this month
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCustomersData = await this.prisma.order.findMany({
      where: {
        items: {
          some: { sellerId: artisanId },
        },
        createdAt: { gte: thirtyDaysAgo },
        customer: {
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    const newCustomers = newCustomersData.length;

    return {
      totalCustomers,
      repeatCustomers,
      newCustomers,
      customerRetentionRate: Number(customerRetentionRate.toFixed(2)),
    };
  }

  private async getCustomerMetrics(
    artisanId: string,
  ): Promise<{
    totalCustomers: number;
    repeatCustomers: number;
    newCustomers: number;
    customerRetentionRate: number;
  }> {
    const customerData = await this.prisma.$queryRaw<
      Array<{
        totalCustomers: bigint;
        repeatCustomers: bigint;
      }>
    >`
      WITH customer_orders AS (
        SELECT 
          o."userId",
          COUNT(*) as order_count
        FROM "Order" o
        JOIN "OrderItem" oi ON o.id = oi."orderId"
        WHERE oi."sellerId" = ${artisanId}
        GROUP BY o."userId"
      )
      SELECT 
        COUNT(*) as "totalCustomers",
        COUNT(CASE WHEN order_count > 1 THEN 1 END) as "repeatCustomers"
      FROM customer_orders
    `;

    const result = customerData[0];
    const totalCustomers = Number(result?.totalCustomers || 0);
    const repeatCustomers = Number(result?.repeatCustomers || 0);
    const customerRetentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // New customers this month
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCustomersData = await this.prisma.order.findMany({
      where: {
        items: {
          some: { sellerId: artisanId },
        },
        createdAt: { gte: thirtyDaysAgo },
        customer: {
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    const newCustomers = newCustomersData.length;

    return {
      totalCustomers,
      repeatCustomers,
      newCustomers,
      customerRetentionRate: Number(customerRetentionRate.toFixed(2)),
    };
  }

  private async getEngagementMetrics(artisanId: string, timeRange: AnalyticsTimeRange) {
    // Follower growth
    const followerGrowth = await this.getFollowerGrowth(artisanId, timeRange);

    // Post performance
    const postPerformance = await this.prisma.post.aggregate({
      where: {
        userId: artisanId,
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
      _count: { id: true },
      _avg: {
        likeCount: true,
        commentCount: true,
      },
      _sum: {
        viewCount: true,
      },
    });

    return {
      followerGrowth,
      postPerformance: {
        totalPosts: postPerformance._count.id,
        averageLikes: Number(postPerformance._avg.likeCount || 0),
        averageComments: Number(postPerformance._avg.commentCount || 0),
        totalViews: Number(postPerformance._sum.viewCount || 0),
      },
    };
  }

  private async getUserMetrics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const thisMonth = new Date();
    thisMonth.setDate(1);

    const [userCounts, activeCounts, newUserCount] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
        where: { status: 'ACTIVE' },
      }),
      this.prisma.user.count({
        where: {
          lastSeenAt: { gte: thirtyDaysAgo },
          status: 'ACTIVE',
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: thisMonth },
          status: 'ACTIVE',
        },
      }),
    ]);

    const totalUsers = userCounts.reduce((sum, count) => sum + count._count.id, 0);
    const totalArtisans = userCounts.find((u) => u.role === 'ARTISAN')?._count.id || 0;
    const totalCustomers = userCounts.find((u) => u.role === 'CUSTOMER')?._count.id || 0;

    return {
      totalUsers,
      totalArtisans,
      totalCustomers,
      activeUsers: activeCounts,
      newUsersThisMonth: newUserCount,
    };
  }

  private async getBusinessMetrics() {
    const [orderStats, productCount, categoryCount] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: { id: true },
        _avg: { totalAmount: true },
      }),
      this.prisma.product.count(),
      this.prisma.category.count(),
    ]);

    return {
      totalRevenue: Number(orderStats._sum.totalAmount || 0),
      totalOrders: orderStats._count.id,
      averageOrderValue: Number(orderStats._avg.totalAmount || 0),
      totalProducts: productCount,
      totalCategories: categoryCount,
    };
  }

  private async getGrowthTrends(timeRange: AnalyticsTimeRange) {
    const groupByClause = this.getGroupByClause(timeRange.period);

    const trends = await this.prisma.$queryRaw<
      Array<{
        period: string;
        newUsers: bigint;
        newArtisans: bigint;
        revenue: number;
        orders: bigint;
      }>
    >`
      SELECT 
        ${groupByClause} as period,
        COUNT(CASE WHEN u."createdAt" >= ${timeRange.startDate} AND u."createdAt" <= ${timeRange.endDate} THEN 1 END) as "newUsers",
        COUNT(CASE WHEN u."createdAt" >= ${timeRange.startDate} AND u."createdAt" <= ${timeRange.endDate} AND u.role = 'ARTISAN' THEN 1 END) as "newArtisans",
        COALESCE(SUM(o."totalAmount"), 0) as revenue,
        COUNT(o.id) as orders
      FROM generate_series(${timeRange.startDate}::date, ${timeRange.endDate}::date, '1 ${timeRange.period}') AS period_date
      LEFT JOIN "User" u ON DATE_TRUNC('${timeRange.period}', u."createdAt") = period_date
      LEFT JOIN "Order" o ON DATE_TRUNC('${timeRange.period}', o."createdAt") = period_date
      GROUP BY period
      ORDER BY period ASC
    `;

    return trends.map((trend) => ({
      period: trend.period,
      newUsers: Number(trend.newUsers),
      newArtisans: Number(trend.newArtisans),
      revenue: Number(trend.revenue),
      orders: Number(trend.orders),
    }));
  }

  private async getTopArtisans(limit: number) {
    const artisans = await this.prisma.$queryRaw<
      Array<{
        id: string;
        shopName: string;
        revenue: number;
        rating: number;
        followerCount: number;
      }>
    >`
      SELECT 
        u.id,
        ap."shopName",
        COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
        COALESCE(ap.rating, 0) as rating,
        u."followerCount"
      FROM "User" u
      JOIN "ArtisanProfile" ap ON u.id = ap."userId"
      LEFT JOIN "OrderItem" oi ON u.id = oi."sellerId"
      WHERE u.role = 'ARTISAN' AND u.status = 'ACTIVE'
      GROUP BY u.id, ap."shopName", ap.rating, u."followerCount"
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;

    return artisans.map((a) => ({
      id: a.id,
      shopName: a.shopName,
      revenue: Number(a.revenue),
      rating: Number(a.rating || 0),
      followerCount: Number(a.followerCount),
    }));
  }

  private async getTopProductsGlobal(limit: number) {
    const products = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        artisanName: string;
        revenue: number;
        viewCount: number;
      }>
    >`
      SELECT 
        p.id,
        p.name,
        ap."shopName" as "artisanName",
        COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
        p."viewCount"
      FROM "Product" p
      JOIN "User" u ON p."sellerId" = u.id
      JOIN "ArtisanProfile" ap ON u.id = ap."userId"
      LEFT JOIN "OrderItem" oi ON p.id = oi."productId"
      WHERE p.status = 'PUBLISHED'
      GROUP BY p.id, p.name, ap."shopName", p."viewCount"
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      artisanName: p.artisanName,
      revenue: Number(p.revenue),
      viewCount: Number(p.viewCount),
    }));
  }

  private getGroupByClause(period: 'day' | 'week' | 'month' | 'quarter' | 'year'): string {
    switch (period) {
      case 'day':
        return `DATE_TRUNC('day', "createdAt")`;
      case 'week':
        return `DATE_TRUNC('week', "createdAt")`;
      case 'month':
        return `DATE_TRUNC('month', "createdAt")`;
      case 'quarter':
        return `DATE_TRUNC('quarter', "createdAt")`;
      case 'year':
        return `DATE_TRUNC('year', "createdAt")`;
      default:
        return `DATE_TRUNC('day', "createdAt")`;
    }
  }
}
