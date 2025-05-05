import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedCartItems() {
  console.log('Seeding cart items...');

  // Get customer users to create cart items for
  const customers = await prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  // Get published products
  const products = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      quantity: { gt: 0 },
    },
    select: {
      id: true,
      sellerId: true,
      name: true,
      price: true,
    },
  });

  const cartItems = [];

  // Create 0-5 cart items for each customer
  for (const customer of customers) {
    // Random number of cart items (0-5)
    const numItems = Math.floor(Math.random() * 6);

    if (numItems === 0) continue;

    // Randomly select products for this customer's cart
    // Exclude products where the customer is the seller
    const availableProducts = products.filter((p) => p.sellerId !== customer.id);

    if (availableProducts.length === 0) continue;

    const cartProducts = availableProducts
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(numItems, availableProducts.length));

    for (const product of cartProducts) {
      // Random quantity 1-3
      const quantity = Math.floor(Math.random() * 3) + 1;

      const cartItem = {
        id: uuidv4(),
        userId: customer.id,
        productId: product.id,
        quantity,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
      };

      await prisma.cartItem.create({
        data: cartItem,
      });

      cartItems.push(cartItem);
    }
  }

  console.log(`Seeded ${cartItems.length} cart items`);

  return cartItems;
}

export { seedCartItems };
