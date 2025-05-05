import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedSavedPosts() {
  console.log('Seeding saved posts...');

  // Get users to create saved posts for
  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  // Get published posts
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      userId: true,
    },
  });

  const savedPosts = [];

  // Create saved posts (approximately 30% of users save any given popular post)
  for (const post of posts) {
    // Filter out post author
    const potentialSavers = users.filter((u) => u.id !== post.userId);

    // Determine how many users will save this post (0-30% of users)
    const saverCount = Math.floor(potentialSavers.length * (Math.random() * 0.3));

    // Randomly select users to save this post
    const savers = potentialSavers.sort(() => 0.5 - Math.random()).slice(0, saverCount);

    for (const saver of savers) {
      // Create the saved post with a date from the past 90 days
      const savedPost = {
        id: uuidv4(),
        userId: saver.id,
        postId: post.id,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
      };

      // Check if saved post already exists
      const existingSave = await prisma.savedPost.findUnique({
        where: {
          userId_postId: {
            userId: saver.id,
            postId: post.id,
          },
        },
      });

      if (!existingSave) {
        await prisma.savedPost.create({
          data: savedPost,
        });

        savedPosts.push(savedPost);
      }
    }
  }

  console.log(`Seeded ${savedPosts.length} saved posts`);

  return savedPosts;
}

export { seedSavedPosts };
