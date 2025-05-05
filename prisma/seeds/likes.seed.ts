import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedLikes() {
  console.log('Seeding likes...');

  // Get published posts with likeCount > 0
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      likeCount: { gt: 0 },
    },
    select: {
      id: true,
      userId: true,
      likeCount: true,
    },
  });

  // Get comments with likeCount > 0
  const comments = await prisma.comment.findMany({
    where: { likeCount: { gt: 0 } },
    select: {
      id: true,
      userId: true,
      likeCount: true,
    },
  });

  // Get users to create likes
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  const likes = [];

  // Create likes for posts
  for (const post of posts) {
    // Get up to likeCount users who are not the post author
    const availableUsers = users.filter((u) => u.id !== post.userId);
    const numLikes = Math.min(post.likeCount, availableUsers.length);

    // Randomly select users to like the post
    const likerUsers = availableUsers.sort(() => 0.5 - Math.random()).slice(0, numLikes);

    for (const liker of likerUsers) {
      // Create the like with small random variations in reaction type
      const reactions = ['like', 'love', 'wow', 'appreciate'];
      const reaction =
        reactions[Math.floor(Math.random() * (Math.random() < 0.8 ? 1 : reactions.length))]; // 80% chance of 'like'

      const like = {
        id: uuidv4(),
        userId: liker.id,
        postId: post.id,
        commentId: null,
        reaction,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      };

      await prisma.like.create({
        data: like,
      });

      likes.push(like);
    }
  }

  // Create likes for comments
  for (const comment of comments) {
    // Get up to likeCount users who are not the comment author
    const availableUsers = users.filter((u) => u.id !== comment.userId);
    const numLikes = Math.min(comment.likeCount, availableUsers.length);

    // Randomly select users to like the comment
    const likerUsers = availableUsers.sort(() => 0.5 - Math.random()).slice(0, numLikes);

    for (const liker of likerUsers) {
      // Create the like (comments only get 'like' reaction for simplicity)
      const like = {
        id: uuidv4(),
        userId: liker.id,
        postId: null,
        commentId: comment.id,
        reaction: 'like',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      };

      await prisma.like.create({
        data: like,
      });

      likes.push(like);
    }
  }

  console.log(`Seeded ${likes.length} likes`);

  return likes;
}

export { seedLikes };
