import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedPostAnalytics() {
  console.log('Seeding post analytics...');

  // Get published posts
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      viewCount: true,
    },
  });

  const analytics = [];

  // Create analytics for each post
  for (const post of posts) {
    // Skip if analytics already exist
    const existingAnalytics = await prisma.postAnalytics.findUnique({
      where: { postId: post.id },
    });

    if (!existingAnalytics) {
      // Calculate analytics based on post viewCount
      // Add some randomness to make data more realistic
      const viewCount = post.viewCount;
      const uniqueViewers = Math.floor(viewCount * (0.7 + Math.random() * 0.2)); // 70-90% unique viewers

      // Some percentage of people who view end up converting (purchasing)
      const conversionCount = Math.floor(uniqueViewers * Math.random() * 0.05); // 0-5% conversions

      // Average read time (between 30 seconds and 5 minutes)
      const avgReadTime = Math.floor(Math.random() * 270) + 30;

      // Bounce rate (percentage who leave quickly) - 10-40%
      const bounceRate = Math.floor(Math.random() * 30) + 10;

      const analytic = {
        id: uuidv4(),
        postId: post.id,
        viewCount,
        uniqueViewers,
        avgReadTime,
        bounceRate,
        conversionCount,
        updatedAt: new Date(),
      };

      await prisma.postAnalytics.create({
        data: analytic,
      });

      analytics.push(analytic);
    }
  }

  console.log(`Seeded ${analytics.length} post analytics records`);

  return analytics;
}

export { seedPostAnalytics };
