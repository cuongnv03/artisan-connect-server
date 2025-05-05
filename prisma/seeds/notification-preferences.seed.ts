import { PrismaClient, NotificationType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedNotificationPreferences() {
  console.log('Seeding notification preferences...');

  // Get users to create preferences for
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  const preferences = [];

  // Create preferences for each user
  for (const user of users) {
    // For each notification type
    for (const type of Object.values(NotificationType)) {
      // 80% chance of having a preference set (otherwise use system defaults)
      if (Math.random() < 0.8) {
        // 80% chance of enabling notifications (realistic distribution)
        const enabled = Math.random() < 0.8;

        const preference = {
          id: uuidv4(),
          userId: user.id,
          type,
          enabled,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        };

        // Check if preference already exists
        const existingPref = await prisma.notificationPreference.findUnique({
          where: {
            userId_type: {
              userId: user.id,
              type,
            },
          },
        });

        if (!existingPref) {
          await prisma.notificationPreference.create({
            data: preference,
          });

          preferences.push(preference);
        }
      }
    }
  }

  console.log(`Seeded ${preferences.length} notification preferences`);

  return preferences;
}

export { seedNotificationPreferences };
