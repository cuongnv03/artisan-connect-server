import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedUserActivity() {
  console.log('Seeding user activity...');

  // Get users to create activity for
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  // Get some entities to reference in activities
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    take: 15,
    select: { id: true },
  });

  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    take: 15,
    select: { id: true },
  });

  const activities = [];

  // Activity types
  const activityTypes = [
    'login',
    'view_product',
    'add_to_cart',
    'checkout',
    'place_order',
    'view_post',
    'like_post',
    'comment_post',
    'update_profile',
    'follow_user',
    'search',
    'message_sent',
    'quote_request',
  ];

  // Sample IP addresses
  const ipAddresses = [
    '192.168.1.1',
    '10.0.0.1',
    '172.16.0.1',
    '127.0.0.1',
    '192.0.2.1',
    '198.51.100.1',
    '203.0.113.1',
    '52.94.236.248',
    '34.212.75.30',
    '13.107.21.200',
  ];

  // Sample user agents
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
  ];

  // Create activity records for each user
  for (const user of users) {
    // Random number of activities per user (10-30)
    const numActivities = Math.floor(Math.random() * 21) + 10;

    for (let i = 0; i < numActivities; i++) {
      // Random activity type
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];

      // Entity ID and type based on activity type
      let entityId: string | null = null;
      let entityType: string | null = null;
      let metadata: any = {};

      switch (activityType) {
        case 'view_product':
        case 'add_to_cart':
          if (products.length > 0) {
            const product = products[Math.floor(Math.random() * products.length)];
            entityId = product.id;
            entityType = 'Product';

            if (activityType === 'view_product') {
              metadata = {
                duration: Math.floor(Math.random() * 300) + 10, // 10-310 seconds
                source: ['search', 'category', 'recommendation', 'direct'][
                  Math.floor(Math.random() * 4)
                ],
              };
            } else {
              metadata = {
                quantity: Math.floor(Math.random() * 3) + 1,
              };
            }
          }
          break;

        case 'view_post':
        case 'like_post':
        case 'comment_post':
          if (posts.length > 0) {
            const post = posts[Math.floor(Math.random() * posts.length)];
            entityId = post.id;
            entityType = 'Post';

            if (activityType === 'view_post') {
              metadata = {
                readTime: Math.floor(Math.random() * 600) + 20, // 20-620 seconds
                scrollPercentage: Math.floor(Math.random() * 101), // 0-100%
              };
            } else if (activityType === 'comment_post') {
              metadata = {
                commentLength: Math.floor(Math.random() * 200) + 10,
              };
            }
          }
          break;

        case 'follow_user':
          // Get other users
          const otherUsers = users.filter((u) => u.id !== user.id);
          if (otherUsers.length > 0) {
            const otherUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
            entityId = otherUser.id;
            entityType = 'User';
          }
          break;

        case 'login':
          metadata = {
            success: Math.random() > 0.05, // 95% success rate
            method: ['password', 'google', 'facebook'][Math.floor(Math.random() * 3)],
          };
          break;

        case 'search':
          metadata = {
            query: [
              'wooden crafts',
              'ceramic bowls',
              'Vietnamese textiles',
              'handmade jewelry',
              'bamboo baskets',
            ][Math.floor(Math.random() * 5)],
            resultsCount: Math.floor(Math.random() * 50) + 1,
          };
          break;

        case 'update_profile':
          metadata = {
            fieldsUpdated: ['bio', 'avatar', 'location', 'socialLinks'][
              Math.floor(Math.random() * 4)
            ],
          };
          break;

        case 'place_order':
          metadata = {
            orderTotal: (Math.floor(Math.random() * 20000) + 1000) / 100, // $10-$210
            itemCount: Math.floor(Math.random() * 5) + 1,
          };
          break;
      }

      // Random timestamps from the past 30 days
      const timestamp = new Date(
        Date.now() -
          Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000 -
          Math.floor(Math.random() * 24) * 60 * 60 * 1000,
      );

      // Create activity record
      const activity = {
        id: uuidv4(),
        userId: user.id,
        activityType,
        entityId,
        entityType,
        metadata: Object.keys(metadata).length > 0 ? metadata : Prisma.JsonNull,
        ipAddress: ipAddresses[Math.floor(Math.random() * ipAddresses.length)],
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        createdAt: timestamp,
      };

      await prisma.userActivity.create({
        data: activity,
      });

      activities.push(activity);
    }
  }

  console.log(`Seeded ${activities.length} user activities`);

  return activities;
}

export { seedUserActivity };
