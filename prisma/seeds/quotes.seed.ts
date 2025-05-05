import { PrismaClient, QuoteStatus, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedQuotes() {
  console.log('Seeding quote requests...');

  // Get customer users to create quotes for
  const customers = await prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  // Get artisan users to receive quotes
  const artisans = await prisma.user.findMany({
    where: {
      role: 'ARTISAN',
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  // Get customizable products
  const products = await prisma.product.findMany({
    where: {
      isCustomizable: true,
      status: 'PUBLISHED',
    },
    select: {
      id: true,
      sellerId: true,
      name: true,
      price: true,
    },
  });

  const quotes = [];

  // Create 0-3 quotes for each customer
  for (const customer of customers) {
    // Random number of quotes (0-3)
    const numQuotes = Math.floor(Math.random() * 4);

    for (let i = 0; i < numQuotes; i++) {
      // Find a random customizable product
      const availableProducts = products.filter((p) => p.sellerId !== customer.id);

      if (availableProducts.length === 0) continue;

      const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];

      // Set status with weighted distribution
      let status: QuoteStatus;
      const randomStatus = Math.random();

      if (randomStatus < 0.3) {
        status = QuoteStatus.COMPLETED; // 30% completed
      } else if (randomStatus < 0.5) {
        status = QuoteStatus.ACCEPTED; // 20% accepted
      } else if (randomStatus < 0.65) {
        status = QuoteStatus.COUNTER_OFFERED; // 15% counter offered
      } else if (randomStatus < 0.75) {
        status = QuoteStatus.REJECTED; // 10% rejected
      } else if (randomStatus < 0.85) {
        status = QuoteStatus.EXPIRED; // 10% expired
      } else {
        status = QuoteStatus.PENDING; // 15% pending
      }

      // Base price and requested discount
      const basePrice = Number(product.price);
      const requestedPrice = Math.floor(basePrice * 0.8 * 100) / 100; // 20% discount requested

      // Counter offer and final price based on status
      let counterOffer = null;
      let finalPrice = null;

      if (status === QuoteStatus.COUNTER_OFFERED) {
        counterOffer = Math.floor(basePrice * 0.9 * 100) / 100; // 10% discount offered
      } else if (status === QuoteStatus.ACCEPTED || status === QuoteStatus.COMPLETED) {
        finalPrice = requestedPrice; // Customer's price accepted
      }

      // Generate custom specifications
      const specifications = [
        'I would like this in a custom size, approximately 20% larger than standard.',
        'Could you use a darker wood finish than shown in the photos?',
        "I'd prefer natural dyes rather than synthetic for this piece.",
        'Can you add a personalized inscription on the bottom?',
        "I'm looking for this design but with blue accents instead of red.",
        'Could you modify this to include extra storage compartments?',
        'I need this piece to match my existing décor - can we discuss color options?',
        'Is it possible to create this with more sustainable materials?',
        "I'd like additional embroidery details along the edges.",
        'Can you make a matching set of smaller items to complement this piece?',
      ][Math.floor(Math.random() * 10)];

      // Create conversation messages if not pending
      let messages = null;

      if (status !== QuoteStatus.PENDING) {
        messages = [
          {
            sender: 'customer',
            text: `Hello, I'm interested in a custom version of your ${product.name}. ${specifications}`,
            timestamp: new Date(
              Date.now() - Math.floor(Math.random() * 30 + 1) * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        ];

        // Add artisan response
        if (status !== QuoteStatus.EXPIRED) {
          const artisanResponse =
            status === QuoteStatus.REJECTED
              ? 'Thank you for your interest. Unfortunately, I cannot accommodate your request at this time due to my current workload.'
              : `Thank you for your interest in my work. I'd be happy to create a custom piece for you. ${status === QuoteStatus.COUNTER_OFFERED ? `I can offer a price of $${counterOffer} which reflects the additional materials and time needed.` : 'Your requested price works for me.'}`;

          messages.push({
            sender: 'artisan',
            text: artisanResponse,
            timestamp: new Date(
              new Date(messages[0].timestamp).getTime() + 24 * 60 * 60 * 1000,
            ).toISOString(),
          });
        }

        // Add customer acceptance for accepted/completed
        if (status === QuoteStatus.ACCEPTED || status === QuoteStatus.COMPLETED) {
          messages.push({
            sender: 'customer',
            text: 'That sounds perfect! I would like to proceed with the order.',
            timestamp: new Date(
              new Date(messages[1].timestamp).getTime() + 12 * 60 * 60 * 1000,
            ).toISOString(),
          });
        }

        // Add order confirmation for completed
        if (status === QuoteStatus.COMPLETED) {
          messages.push({
            sender: 'artisan',
            text: 'Great! I have created the order in our system. You can now complete the purchase.',
            timestamp: new Date(
              new Date(messages[2].timestamp).getTime() + 6 * 60 * 60 * 1000,
            ).toISOString(),
          });
        }
      }

      // Quote creation and expiration dates
      const createdAt = new Date(
        Date.now() - Math.floor(Math.random() * 60 + 1) * 24 * 60 * 60 * 1000,
      );
      const expiresAt =
        status === QuoteStatus.EXPIRED
          ? new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000)
          : null;

      // Handle the messages value properly
      const finalMessages = messages ? messages : Prisma.JsonNull;

      // Create the quote
      const quoteId = uuidv4();

      const quote = {
        id: quoteId,
        productId: product.id,
        customerId: customer.id,
        artisanId: product.sellerId,
        requestedPrice,
        specifications,
        status,
        counterOffer,
        finalPrice,
        messages: finalMessages,
        expiresAt,
        createdAt,
        updatedAt: messages
          ? new Date(new Date(messages[messages.length - 1].timestamp))
          : createdAt,
      };

      await prisma.quoteRequest.create({
        data: quote,
      });

      quotes.push(quote);
    }
  }

  console.log(`Seeded ${quotes.length} quote requests`);

  return quotes;
}

export { seedQuotes };
