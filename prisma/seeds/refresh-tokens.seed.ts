import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedRefreshTokens() {
  console.log('Seeding refresh tokens...');

  // Get active users
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  const refreshTokens = [];

  // Create refresh tokens for each user (0-2 per user)
  for (const user of users) {
    // Random number of tokens (0-2)
    const numTokens = Math.floor(Math.random() * 3);

    for (let i = 0; i < numTokens; i++) {
      // 80% valid tokens, 20% revoked
      const isRevoked = Math.random() < 0.2;

      // Expiration date (valid tokens: 1-7 days from now, revoked: 1-30 days ago)
      let expiresAt;
      let revokedAt = null;

      if (isRevoked) {
        expiresAt = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
        revokedAt = new Date(
          expiresAt.getTime() - Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000,
        );
      } else {
        expiresAt = new Date(
          Date.now() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000,
        );
      }

      // Create refresh token
      const refreshToken = {
        id: uuidv4(),
        userId: user.id,
        token: uuidv4(), // Simple token
        expiresAt,
        revokedAt,
        createdAt: new Date(
          expiresAt.getTime() - (Math.floor(Math.random() * 6) + 1) * 24 * 60 * 60 * 1000,
        ),
      };

      // Check if token already exists
      const existingToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken.token },
      });

      if (!existingToken) {
        await prisma.refreshToken.create({
          data: refreshToken,
        });

        refreshTokens.push(refreshToken);
      }
    }
  }

  console.log(`Seeded ${refreshTokens.length} refresh tokens`);

  return refreshTokens;
}

export { seedRefreshTokens };
