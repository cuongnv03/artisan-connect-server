import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedReviews() {
  console.log('Seeding product reviews...');

  // Get all products that have reviewCount > 0
  const products = await prisma.product.findMany({
    where: {
      reviewCount: { gt: 0 },
      status: 'PUBLISHED',
    },
    select: {
      id: true,
      sellerId: true,
      name: true,
      reviewCount: true,
    },
  });

  // Get customer users to create reviews
  const customers = await prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  if (customers.length === 0) {
    console.log('No customers found to create reviews');
    return [];
  }

  const reviewTitles = [
    'Beautiful craftsmanship',
    'Exceeded my expectations',
    'Truly unique piece',
    'Wonderful addition to my home',
    'Excellent quality',
    'Stunning handmade item',
    'Perfect gift',
    'Exquisite detail',
    'Not quite what I expected',
    'Smaller than I thought',
    'Amazing value',
    'Traditional artistry at its finest',
    'Exactly as described',
    'Love the traditional design',
    'Superb workmanship',
    'Authentic and beautiful',
    'Disappointed with quality',
    'Arrived damaged but seller resolved quickly',
    'Worth every penny',
    'A true work of art',
  ];

  const reviewComments = [
    "I'm absolutely in love with this piece. The craftsmanship is exceptional, and you can tell it was made with care and skill. The colors are even more vibrant in person than in the photos.",
    "This handcrafted item exceeded all my expectations. The attention to detail is remarkable, and it's clear that traditional techniques were used. It's become a conversation starter in my home.",
    "The artisan's skill really shines through in this piece. The quality is outstanding, and it's obvious that hours of careful work went into creating it. Shipping was also fast and the item was well-packaged.",
    'Beautiful work! This is my second purchase from this artisan, and I continue to be impressed by the quality and authenticity of their crafts. The natural materials used add such warmth to my space.',
    'I bought this as a gift for my mother who collects handmade items, and she was absolutely thrilled. The craftsmanship is excellent, and the traditional design is both beautiful and functional.',
    "The photos don't do this piece justice - it's even more stunning in person. I appreciate the card that came with it explaining the traditional techniques used and the story behind the craft.",
    'While the quality is good, the item was smaller than I expected based on the description. Make sure to check the dimensions carefully before ordering.',
    "I'm a bit disappointed with my purchase. The craftsmanship isn't as refined as I'd hoped, and there were a few imperfections that weren't mentioned in the listing.",
    'What a treasure! This piece is truly museum-quality, and I feel fortunate to have found such an authentic example of traditional Vietnamese craft. Worth every penny.',
    "The item arrived beautifully packaged with information about the artisan and the history of the craft. I'm impressed by both the product and the thoughtful presentation.",
    "I've been searching for authentic handmade items, and this exceeded my expectations. The natural materials and traditional techniques make this piece stand out from mass-produced alternatives.",
    'The colors and patterns are even more beautiful in person. This piece has become the focal point of my living room, and I receive compliments on it regularly.',
    'This item brings such warmth and character to my home. I appreciate supporting traditional artisans and preserving these ancient crafts.',
    "While it's a beautiful piece, the shipping took much longer than expected. The seller was communicative though, which I appreciated.",
    "I purchased this for my collection of Southeast Asian crafts, and it's a standout piece. The level of detail is extraordinary, and it perfectly exemplifies the traditional style.",
    'Not quite as pictured - the colors are more muted in person. Still a lovely handmade item, but slightly different from what I expected.',
    'The craftsmanship is incredible. Looking at the intricate details, I can imagine the hours of skilled work that went into creating this beautiful piece.',
    "I'm extremely happy with this purchase. The artisan clearly takes pride in their work, and it shows in the quality of the finished product.",
    "This handmade item has such character and soul, unlike anything you could find in a department store. I'll definitely be ordering from this artisan again.",
    'A perfect balance of traditional techniques and contemporary design. This piece works beautifully in my modern home while still honoring its cultural roots.',
  ];

  const reviews = [];

  for (const product of products) {
    // Create the number of reviews indicated by reviewCount
    for (let i = 0; i < product.reviewCount; i++) {
      // Skip if we've reached the reviewCount
      if (i >= product.reviewCount) break;

      // Randomly select a customer (excluding the seller)
      const availableCustomers = customers.filter((c) => c.id !== product.sellerId);
      if (availableCustomers.length === 0) continue;

      const randomCustomerIndex = Math.floor(Math.random() * availableCustomers.length);
      const customer = availableCustomers[randomCustomerIndex];

      // Check if this customer already reviewed this product
      const existingReview = await prisma.review.findUnique({
        where: {
          userId_productId: {
            userId: customer.id,
            productId: product.id,
          },
        },
      });

      if (existingReview) continue;

      // Random rating between 1 and 5, weighted toward higher ratings
      let rating;
      const randomValue = Math.random();
      if (randomValue < 0.7) {
        // 70% chance of 4 or 5 stars
        rating = Math.floor(Math.random() * 2) + 4;
      } else if (randomValue < 0.9) {
        // 20% chance of 3 stars
        rating = 3;
      } else {
        // 10% chance of 1 or 2 stars
        rating = Math.floor(Math.random() * 2) + 1;
      }

      // Randomly select title and comment based on rating
      let title, comment;

      if (rating >= 4) {
        // Positive reviews
        title = reviewTitles.filter(
          (t) =>
            !t.includes('Not quite') &&
            !t.includes('Smaller') &&
            !t.includes('Disappointed') &&
            !t.includes('damaged'),
        )[Math.floor(Math.random() * 15)];
        comment = reviewComments.filter(
          (c) => !c.includes('disappointed') && !c.includes('smaller') && !c.includes('Not quite'),
        )[Math.floor(Math.random() * 15)];
      } else if (rating === 3) {
        // Neutral reviews
        title = reviewTitles.filter(
          (t) => t.includes('Not quite') || t.includes('Smaller') || t === 'Exactly as described',
        )[Math.floor(Math.random() * 3)];
        comment = reviewComments.filter(
          (c) =>
            c.includes('Not quite') ||
            c.includes('smaller') ||
            c.includes('colors are more muted') ||
            c.includes('shipping took'),
        )[Math.floor(Math.random() * 4)];
      } else {
        // Negative reviews
        title = reviewTitles.filter((t) => t.includes('Disappointed') || t.includes('damaged'))[
          Math.floor(Math.random() * 2)
        ];
        comment = reviewComments.filter(
          (c) => c.includes('disappointed') || c.includes('arrived damaged'),
        )[Math.floor(Math.random() * 2)];
      }

      // Random helpful count for the review
      const helpfulCount = Math.floor(Math.random() * 10);

      // Create the review
      const reviewId = uuidv4();

      const review = {
        id: reviewId,
        userId: customer.id,
        productId: product.id,
        rating,
        title,
        comment,
        images:
          Math.random() < 0.2
            ? [`https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/300/300`]
            : [],
        helpfulCount,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
      };

      await prisma.review.create({
        data: review,
      });

      reviews.push(review);

      // Create helpful marks for this review
      if (helpfulCount > 0) {
        // Get random users who will mark the review as helpful
        const helpfulUsers = availableCustomers
          .filter((c) => c.id !== customer.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, helpfulCount);

        for (const helpfulUser of helpfulUsers) {
          await prisma.reviewHelpful.create({
            data: {
              id: uuidv4(),
              reviewId,
              userId: helpfulUser.id,
            },
          });
        }
      }
    }
  }

  console.log(`Seeded ${reviews.length} product reviews`);

  return reviews;
}

export { seedReviews };
