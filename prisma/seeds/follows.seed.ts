import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedFollows() {
  console.log('Seeding follows...');

  // Get all users
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      role: true,
    },
  });

  // Separate users by role
  const artisans = users.filter((u) => u.role === 'ARTISAN');
  const customers = users.filter((u) => u.role === 'CUSTOMER');
  const allUsers = [...artisans, ...customers];

  const follows = [];

  // Create follows (more likely for artisans to be followed)

  // 1. Customers following artisans (many customers follow multiple artisans)
  for (const customer of customers) {
    // Random number of artisans to follow (50-100% of artisans)
    const numArtisansToFollow = Math.floor(
      Math.random() * (artisans.length / 2) + artisans.length / 2,
    );

    // Randomly select artisans to follow
    const artisansToFollow = artisans.sort(() => 0.5 - Math.random()).slice(0, numArtisansToFollow);

    for (const artisan of artisansToFollow) {
      const follow = {
        id: uuidv4(),
        followerId: customer.id,
        followingId: artisan.id,
        status: 'accepted',
        notifyNewPosts: Math.random() < 0.7, // 70% chance of notifications enabled
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000),
      };

      await prisma.follow.create({
        data: follow,
      });

      follows.push(follow);
    }
  }

  // 2. Artisans following each other (less common)
  for (const artisan of artisans) {
    // Random number of other artisans to follow (0-50% of other artisans)
    const numOtherArtisansToFollow = Math.floor((Math.random() * artisans.length) / 2);

    // Randomly select other artisans to follow (excluding self)
    const otherArtisans = artisans.filter((a) => a.id !== artisan.id);
    const artisansToFollow = otherArtisans
      .sort(() => 0.5 - Math.random())
      .slice(0, numOtherArtisansToFollow);

    for (const otherArtisan of artisansToFollow) {
      const follow = {
        id: uuidv4(),
        followerId: artisan.id,
        followingId: otherArtisan.id,
        status: 'accepted',
        notifyNewPosts: Math.random() < 0.5, // 50% chance of notifications enabled
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000),
      };

      await prisma.follow.create({
        data: follow,
      });

      follows.push(follow);
    }
  }

  // 3. Random follows between customers (least common)
  for (const customer of customers) {
    // Random number of other customers to follow (0-20% of other customers)
    const numOtherCustomersToFollow = Math.floor((Math.random() * customers.length) / 5);

    // Randomly select other customers to follow (excluding self)
    const otherCustomers = customers.filter((c) => c.id !== customer.id);
    const customersToFollow = otherCustomers
      .sort(() => 0.5 - Math.random())
      .slice(0, numOtherCustomersToFollow);

    for (const otherCustomer of customersToFollow) {
      const follow = {
        id: uuidv4(),
        followerId: customer.id,
        followingId: otherCustomer.id,
        status: 'accepted',
        notifyNewPosts: Math.random() < 0.3, // 30% chance of notifications enabled
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000),
      };

      await prisma.follow.create({
        data: follow,
      });

      follows.push(follow);
    }
  }

  // Update follower and following counts for all users
  for (const user of allUsers) {
    const followerCount = follows.filter((f) => f.followingId === user.id).length;
    const followingCount = follows.filter((f) => f.followerId === user.id).length;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        followerCount,
        followingCount,
      },
    });
  }

  console.log(`Seeded ${follows.length} follows`);

  return follows;
}

export { seedFollows };
