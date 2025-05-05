import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedComments() {
  console.log('Seeding comments...');

  // Get published posts with commentCount > 0
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      commentCount: { gt: 0 },
    },
    select: {
      id: true,
      userId: true,
      title: true,
      commentCount: true,
    },
  });

  // Get users to create comments
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  if (users.length === 0) {
    console.log('No users found to create comments');
    return [];
  }

  const commentContents = [
    'This is such a beautiful piece! I love seeing the traditional techniques being preserved.',
    "Thank you for sharing your knowledge. I've been trying to learn these techniques and your tutorial is incredibly helpful.",
    'The level of craftsmanship in your work is truly amazing. How long have you been practicing this craft?',
    "I visited Vietnam last year and was able to see some of these techniques in person. It's wonderful to see them being continued!",
    "Your dedication to preserving these traditional methods is inspiring. I'll definitely be following your work.",
    "I purchased one of your pieces last month and it's become a treasured part of my home. Thank you for creating such beauty.",
    "Could you share more about how you source your materials? I'm interested in the sustainability aspects of traditional crafts.",
    'This post brought back memories of watching my grandmother work with similar techniques. Thank you for preserving these cultural treasures.',
    "I'm curious about how these traditional methods can be adapted for modern living spaces. Do you offer custom pieces?",
    'The colors and textures in your work are absolutely stunning. Do you use natural dyes for all your pieces?',
    "I've been following your workshop for years and am continually impressed by your commitment to quality.",
    'What a fascinating process! I had no idea how much work goes into creating these pieces.',
    'I attended one of your workshops last month and it changed how I see handcrafted items. Thank you for sharing your knowledge!',
    'Would love to see a tutorial on the finishing techniques you mentioned in this post.',
    'Your stories about the history of this craft are as beautiful as the pieces themselves.',
    'How do you balance traditional techniques with modern design preferences?',
    "I've shared this with my design community - everyone is amazed by the level of detail in your work.",
    "Have you considered teaching online workshops? I'd love to learn but can't travel to Vietnam.",
    'The connection between craft and cultural identity in your work is powerful. Thank you for sharing these stories.',
    'Looking forward to your event next month! Will you be demonstrating the techniques you described here?',
    'Your explanation of the symbolism behind these traditional patterns was eye-opening.',
    'As someone trying to live more sustainably, I appreciate your commitment to eco-friendly materials and methods.',
  ];

  const comments = [];
  const commentReplies = [];

  for (const post of posts) {
    // Create the number of comments indicated by commentCount
    const numComments = Math.min(post.commentCount, 15); // Cap at 15 comments per post

    const postComments = [];

    for (let i = 0; i < numComments; i++) {
      // Randomly select a user (excluding post author for most comments)
      const excludeAuthor = Math.random() < 0.9; // 90% chance to exclude author
      const availableUsers = excludeAuthor ? users.filter((u) => u.id !== post.userId) : users;

      if (availableUsers.length === 0) continue;

      const randomUserIndex = Math.floor(Math.random() * availableUsers.length);
      const commenter = availableUsers[randomUserIndex];

      // Random content
      const content = commentContents[Math.floor(Math.random() * commentContents.length)];

      // Create the comment
      const commentId = uuidv4();

      const comment = {
        id: commentId,
        postId: post.id,
        userId: commenter.id,
        parentId: null, // This is a top-level comment
        content,
        mediaUrl:
          Math.random() < 0.1
            ? `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/300/300`
            : null,
        likeCount: Math.floor(Math.random() * 10),
        replyCount: Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0, // 30% chance of having replies
        isEdited: Math.random() < 0.1, // 10% chance of being edited
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      };

      await prisma.comment.create({
        data: comment,
      });

      comments.push(comment);
      postComments.push(comment);

      // Create replies for this comment if it has replyCount > 0
      if (comment.replyCount > 0) {
        for (let j = 0; j < comment.replyCount; j++) {
          // Select user for reply (post author replies 40% of the time)
          const isAuthorReply = Math.random() < 0.4;
          const replyUserId = isAuthorReply
            ? post.userId
            : users[Math.floor(Math.random() * users.length)].id;

          // Content for reply
          let replyContent;

          if (isAuthorReply) {
            replyContent = [
              "Thank you for your kind words! I'm glad you appreciate the craftsmanship.",
              'Yes, I do offer custom pieces. Feel free to message me for details.',
              "The technique actually takes years to master. I've been practicing for over a decade now.",
              'I use natural dyes whenever possible. They create more authentic and long-lasting colors.',
              "I'm so happy to hear you're enjoying your purchase!",
              'Great question! I source my materials from local suppliers who practice sustainable harvesting.',
              "I'd be happy to share more about the process in future posts.",
              'Thank you for attending the workshop! It was wonderful to have you there.',
            ][Math.floor(Math.random() * 8)];
          } else {
            replyContent = [
              'I was wondering the same thing! The craftsmanship is incredible.',
              "I've purchased from this artisan before. The quality is exceptional.",
              "I'd love to see a tutorial on this specific technique too!",
              'Does anyone know if they ship internationally?',
              'The cultural context really adds depth to the appreciation of these crafts.',
              "I've tried learning this technique and it's much harder than it looks!",
              'Looking forward to seeing more of your work!',
              'Have you considered showcasing your work at international exhibitions?',
            ][Math.floor(Math.random() * 8)];
          }

          // Create the reply
          const replyId = uuidv4();

          const reply = {
            id: replyId,
            postId: post.id,
            userId: replyUserId,
            parentId: commentId, // Reference to parent comment
            content: replyContent,
            mediaUrl: null, // Replies typically don't have media
            likeCount: Math.floor(Math.random() * 5),
            replyCount: 0, // No nested replies for simplicity
            isEdited: Math.random() < 0.05, // 5% chance of being edited
            createdAt: new Date(
              Math.min(
                Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000,
                comment.createdAt.getTime() + 1000 * 60 * 60 * 24 * 2, // Max 2 days after parent comment
              ),
            ),
          };

          await prisma.comment.create({
            data: reply,
          });

          commentReplies.push(reply);
        }
      }
    }
  }

  console.log(`Seeded ${comments.length} comments and ${commentReplies.length} comment replies`);

  return { comments, commentReplies };
}

export { seedComments };
