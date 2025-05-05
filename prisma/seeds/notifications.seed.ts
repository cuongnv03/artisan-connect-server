import { PrismaClient, NotificationType, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedNotifications() {
  console.log('Seeding notifications...');

  // Get users to create notifications for
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  // Get some entities to reference in notifications
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    take: 10,
    select: { id: true, name: true, sellerId: true },
  });

  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    take: 10,
    select: { id: true, title: true, userId: true },
  });

  const orders = await prisma.order.findMany({
    take: 10,
    select: { id: true, orderNumber: true, userId: true },
  });

  const notifications = [];

  // Create 5-15 notifications for each user
  for (const user of users) {
    // Random number of notifications (5-15)
    const numNotifications = Math.floor(Math.random() * 11) + 5;

    for (let i = 0; i < numNotifications; i++) {
      // Random notification type
      const notificationTypes = Object.values(NotificationType);
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];

      // Generate notification content based on type
      let title = '';
      let content = '';
      let data: any = {};
      let relatedUserId: string | null = null;
      let relatedEntityId: string | null = null;
      let relatedEntityType: string | null = null;

      // Random related user (not self)
      const otherUsers = users.filter((u) => u.id !== user.id);
      if (otherUsers.length > 0) {
        relatedUserId = otherUsers[Math.floor(Math.random() * otherUsers.length)].id;
      }

      switch (type) {
        case NotificationType.LIKE:
          title = 'New Like';
          if (posts.length > 0) {
            const post = posts[Math.floor(Math.random() * posts.length)];
            content = `Someone liked your post "${post.title.substring(0, 30)}${post.title.length > 30 ? '...' : ''}"`;
            relatedEntityId = post.id;
            relatedEntityType = 'Post';
            data = { postId: post.id };
          } else {
            content = 'Someone liked your content';
          }
          break;

        case NotificationType.COMMENT:
          title = 'New Comment';
          if (posts.length > 0) {
            const post = posts[Math.floor(Math.random() * posts.length)];
            content = `New comment on your post "${post.title.substring(0, 30)}${post.title.length > 30 ? '...' : ''}"`;
            relatedEntityId = post.id;
            relatedEntityType = 'Post';
            data = {
              postId: post.id,
              commentText: 'Great post! I really enjoyed reading about your craft process.',
            };
          } else {
            content = 'Someone commented on your content';
          }
          break;

        case NotificationType.FOLLOW:
          title = 'New Follower';
          content = 'You have a new follower';
          relatedEntityType = 'User';
          data = { followerId: relatedUserId };
          break;

        case NotificationType.MENTION:
          title = 'You were mentioned';
          if (posts.length > 0) {
            const post = posts[Math.floor(Math.random() * posts.length)];
            content = `You were mentioned in a post by someone`;
            relatedEntityId = post.id;
            relatedEntityType = 'Post';
            data = { postId: post.id };
          } else {
            content = 'You were mentioned in content';
          }
          break;

        case NotificationType.QUOTE_REQUEST:
          title = 'New Quote Request';
          if (products.length > 0) {
            const product = products[Math.floor(Math.random() * products.length)];
            content = `You received a custom quote request for "${product.name}"`;
            relatedEntityId = product.id;
            relatedEntityType = 'Product';
            data = { productId: product.id, customerId: relatedUserId };
          } else {
            content = 'You received a custom quote request';
          }
          break;

        case NotificationType.QUOTE_RESPONSE:
          title = 'Quote Response';
          if (products.length > 0) {
            const product = products[Math.floor(Math.random() * products.length)];
            content = `An artisan responded to your quote request for "${product.name}"`;
            relatedEntityId = product.id;
            relatedEntityType = 'Product';
            data = { productId: product.id, artisanId: relatedUserId };
          } else {
            content = 'Your quote request received a response';
          }
          break;

        case NotificationType.ORDER_STATUS:
          title = 'Order Status Update';
          if (orders.length > 0) {
            const order = orders[Math.floor(Math.random() * orders.length)];
            content = `Your order ${order.orderNumber} has been shipped`;
            relatedEntityId = order.id;
            relatedEntityType = 'Order';
            data = { orderId: order.id, status: 'SHIPPED' };
          } else {
            content = 'Your order status has been updated';
          }
          break;

        case NotificationType.MESSAGE:
          title = 'New Message';
          content = 'You received a new message';
          relatedEntityType = 'Message';
          data = { senderId: relatedUserId };
          break;

        case NotificationType.REVIEW:
          title = 'New Review';
          if (products.length > 0) {
            const product = products[Math.floor(Math.random() * products.length)];
            content = `Your product "${product.name}" received a new review`;
            relatedEntityId = product.id;
            relatedEntityType = 'Product';
            data = { productId: product.id, rating: Math.floor(Math.random() * 3) + 3 };
          } else {
            content = 'Your product received a new review';
          }
          break;

        case NotificationType.SYSTEM:
          title = 'System Notification';
          content = [
            'Welcome to ArtisanConnect! Complete your profile to get started.',
            'Your account has been verified successfully.',
            "We've updated our privacy policy. Please review the changes.",
            'Maintenance scheduled: The platform will be unavailable on Sunday from 2-4 AM.',
            'New feature: You can now schedule posts in advance!',
          ][Math.floor(Math.random() * 5)];
          relatedEntityType = 'System';
          relatedUserId = null;
          data = { type: 'info' };
          break;
      }

      // Random read status (70% unread for realism)
      const isRead = Math.random() > 0.7;
      const readAt = isRead
        ? new Date(Date.now() - Math.floor(Math.random() * 24) * 60 * 60 * 1000)
        : null;

      // Create the notification with a date from the past 30 days
      const notification = {
        id: uuidv4(),
        userId: user.id,
        type,
        title,
        content,
        isRead,
        data: data ? data : Prisma.JsonNull,
        relatedUserId,
        relatedEntityId,
        relatedEntityType,
        readAt,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      };

      await prisma.notification.create({
        data: notification,
      });

      notifications.push(notification);
    }
  }

  console.log(`Seeded ${notifications.length} notifications`);

  return notifications;
}

export { seedNotifications };
