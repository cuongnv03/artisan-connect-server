import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedSessions() {
  console.log('Seeding sessions...');

  // Get active users
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  // Sample user agents
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
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

  const sessions = [];

  // Create 1-3 sessions for each user
  for (const user of users) {
    // Random number of sessions (1-3)
    const numSessions = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numSessions; i++) {
      // Create expiration date (1-30 days from now)
      const expiresAt = new Date(
        Date.now() + (Math.floor(Math.random() * 30) + 1) * 24 * 60 * 60 * 1000,
      );

      // Create session record
      const session = {
        id: uuidv4(),
        userId: user.id,
        token: uuidv4(), // Simple token
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        ipAddress: ipAddresses[Math.floor(Math.random() * ipAddresses.length)],
        lastActive: new Date(Date.now() - Math.floor(Math.random() * 12) * 60 * 60 * 1000), // 0-12 hours ago
        expiresAt,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000), // 0-7 days ago
      };

      // Check if session already exists for this token
      const existingSession = await prisma.session.findUnique({
        where: { token: session.token },
      });

      if (!existingSession) {
        await prisma.session.create({
          data: session,
        });

        sessions.push(session);
      }
    }
  }

  console.log(`Seeded ${sessions.length} sessions`);

  return sessions;
}

export { seedSessions };
