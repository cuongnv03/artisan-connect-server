import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedProfiles() {
  console.log('Seeding profiles...');

  // Get all users to create profiles for
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  const profiles = [];

  for (const user of users) {
    const hasProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!hasProfile) {
      // Handle JSON fields properly
      const socialLinks =
        Math.random() > 0.4
          ? {
              instagram:
                Math.random() > 0.5
                  ? `https://instagram.com/user_${Math.random().toString(36).substring(7)}`
                  : null,
              facebook:
                Math.random() > 0.5
                  ? `https://facebook.com/user_${Math.random().toString(36).substring(7)}`
                  : null,
              twitter:
                Math.random() > 0.7
                  ? `https://twitter.com/user_${Math.random().toString(36).substring(7)}`
                  : null,
            }
          : Prisma.JsonNull;

      const preferences =
        Math.random() > 0.6
          ? {
              theme: ['light', 'dark', 'system'][Math.floor(Math.random() * 3)],
              emailNotifications: Math.random() > 0.3,
              language: ['en', 'vi'][Math.floor(Math.random() * 2)],
            }
          : Prisma.JsonNull;

      const profile = await prisma.profile.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          coverUrl:
            Math.random() > 0.3
              ? `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/1200/300`
              : null,
          location:
            Math.random() > 0.2
              ? [
                  'Hanoi, Vietnam',
                  'Ho Chi Minh City, Vietnam',
                  'Da Nang, Vietnam',
                  'Hue, Vietnam',
                  'Nha Trang, Vietnam',
                ][Math.floor(Math.random() * 5)]
              : null,
          website:
            Math.random() > 0.5
              ? `https://example.com/${Math.random().toString(36).substring(7)}`
              : null,
          dateOfBirth:
            Math.random() > 0.3
              ? new Date(
                  Date.now() - Math.floor(Math.random() * 40 + 18) * 365 * 24 * 60 * 60 * 1000,
                )
              : null,
          gender:
            Math.random() > 0.1
              ? ['male', 'female', 'other', 'prefer_not_to_say'][Math.floor(Math.random() * 4)]
              : null,
          socialLinks: socialLinks,
          preferences: preferences,
        },
      });

      profiles.push(profile);
    }
  }

  console.log(`Seeded ${profiles.length} profiles`);

  return profiles;
}

export { seedProfiles };
