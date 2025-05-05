import { PrismaClient } from '@prisma/client';
import { seedUsers } from './users.seed';
import { seedProfiles } from './profiles.seed';
import { seedAddresses } from './addresses.seed';
import { seedArtisanProfiles } from './artisan-profiles.seed';
import { seedUpgradeRequests } from './artisan-upgrade-requests.seed';
import { seedCategories } from './categories.seed';
import { seedProducts } from './products.seed';
import { seedReviews } from './reviews.seed';
import { seedPosts } from './posts.seed';
import { seedComments } from './comments.seed';
import { seedLikes } from './likes.seed';
import { seedFollows } from './follows.seed';
import { seedCartItems } from './cart-items.seed';
import { seedOrders } from './orders.seed';
import { seedQuotes } from './quotes.seed';
import { seedMessages } from './messages.seed';
import { seedNotifications } from './notifications.seed';
import { seedNotificationPreferences } from './notification-preferences.seed';
import { seedSavedPosts } from './saved-posts.seed';
import { seedUserActivity } from './user-activity.seed';
import { seedPostAnalytics } from './post-analytics.seed';
import { seedSystemConfig } from './system-config.seed';
import { seedSessions } from './sessions.seed';
import { seedRefreshTokens } from './refresh-tokens.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  try {
    // Users and profiles
    await seedUsers();
    await seedProfiles();
    await seedAddresses();

    // Artisan profiles
    await seedArtisanProfiles();
    await seedUpgradeRequests();

    // Products and categories
    await seedCategories();
    await seedProducts();
    await seedReviews();

    // Posts and social
    await seedPosts();
    await seedComments();
    await seedLikes();
    await seedFollows();
    await seedSavedPosts();

    // E-commerce
    await seedCartItems();
    await seedOrders();
    await seedQuotes();

    // Messages and notifications
    await seedMessages();
    await seedNotifications();
    await seedNotificationPreferences();

    // Analytics and system
    await seedUserActivity();
    await seedPostAnalytics();
    await seedSystemConfig();

    // Auth-related
    await seedSessions();
    await seedRefreshTokens();

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
