import { PrismaClient, OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedOrders() {
  console.log('Seeding orders...');

  // Get customer users WITH their addresses properly included
  const customers = await prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
    select: {
      id: true,
      profile: {
        select: {
          addresses: {
            select: {
              id: true,
            },
          },
        },
      },
    },
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

  const orders = [];
  const orderItems = [];
  const orderStatuses = [];

  // Create 0-5 orders for each customer
  for (const customer of customers) {
    // Skip customers without addresses
    if (!customer.profile?.addresses || customer.profile.addresses.length === 0) continue;

    // Random number of orders (0-5)
    const numOrders = Math.floor(Math.random() * 6);

    for (let i = 0; i < numOrders; i++) {
      // Random number of items in this order (1-5)
      const numItems = Math.floor(Math.random() * 5) + 1;

      // Randomly select products for this order
      // Exclude products where the customer is the seller
      const availableProducts = products.filter((p) => p.sellerId !== customer.id);

      if (availableProducts.length === 0) continue;

      const orderProducts = availableProducts
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(numItems, availableProducts.length));

      // Skip if no products selected
      if (orderProducts.length === 0) continue;

      // Calculate order totals
      let subtotal = 0;
      for (const product of orderProducts) {
        // Random quantity 1-3
        const quantity = Math.floor(Math.random() * 3) + 1;
        // Properly convert Decimal to number
        subtotal += Number(product.price) * quantity;
      }

      // Other amounts
      const shippingCost = Math.floor(Math.random() * 1000) / 100; // 0 - 10.00
      const tax = Math.floor(subtotal * 0.1 * 100) / 100; // 10% tax

      // Apply discount to some orders
      const hasDiscount = Math.random() < 0.3; // 30% chance
      const discount = hasDiscount ? Math.floor(subtotal * 0.15 * 100) / 100 : 0; // 15% discount if applicable

      const totalAmount = subtotal + shippingCost + tax - discount;

      // Random status
      let status: OrderStatus;
      const randomStatus = Math.random();

      if (randomStatus < 0.5) {
        status = OrderStatus.DELIVERED; // 50% completed orders
      } else if (randomStatus < 0.7) {
        status = OrderStatus.SHIPPED; // 20% shipped
      } else if (randomStatus < 0.85) {
        status = OrderStatus.PROCESSING; // 15% processing
      } else if (randomStatus < 0.95) {
        status = OrderStatus.PAID; // 10% paid
      } else if (randomStatus < 0.98) {
        status = OrderStatus.CANCELLED; // 3% cancelled
      } else {
        status = OrderStatus.REFUNDED; // 2% refunded
      }

      // Payment details
      const paymentMethods = [
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.BANK_TRANSFER,
        PaymentMethod.PAYPAL,
        PaymentMethod.CASH_ON_DELIVERY,
      ];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      // Fix the comparison - PENDING is a valid status in the schema but we don't use it here
      const paymentStatus = status !== OrderStatus.CANCELLED && status !== OrderStatus.REFUNDED;

      // Select a random address from customer's addresses
      const addressId =
        customer.profile.addresses[Math.floor(Math.random() * customer.profile.addresses.length)]
          .id;

      // Create the order
      const orderId = uuidv4();
      const orderNumber = `ORD-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')}-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')}`;

      // Order date based on status
      let orderDate;
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;

      if (status === OrderStatus.DELIVERED) {
        orderDate = new Date(now - Math.floor(Math.random() * 90 + 14) * dayInMs); // 14-104 days ago
      } else if (status === OrderStatus.SHIPPED) {
        orderDate = new Date(now - Math.floor(Math.random() * 10 + 5) * dayInMs); // 5-15 days ago
      } else if (status === OrderStatus.PROCESSING) {
        orderDate = new Date(now - Math.floor(Math.random() * 4 + 1) * dayInMs); // 1-5 days ago
      } else {
        orderDate = new Date(now - Math.floor(Math.random() * 14) * dayInMs); // 0-14 days ago
      }

      // Estimated delivery for processing and shipped orders
      const estimatedDelivery =
        status === OrderStatus.PROCESSING || status === OrderStatus.SHIPPED
          ? new Date(orderDate.getTime() + (7 + Math.floor(Math.random() * 7)) * dayInMs) // 7-14 days after order
          : null;

      // Tracking info for shipped orders
      const trackingNumber =
        status === OrderStatus.SHIPPED ? `TRK${Math.floor(Math.random() * 10000000000)}` : null;
      const trackingUrl = trackingNumber ? `https://example.com/track/${trackingNumber}` : null;

      const order = {
        id: orderId,
        orderNumber,
        userId: customer.id,
        addressId,
        status,
        totalAmount,
        subtotal,
        tax,
        shippingCost,
        discount,
        paymentMethod,
        paymentStatus,
        paymentIntentId: paymentStatus ? `pi_${Math.random().toString(36).substring(2, 12)}` : null,
        notes: Math.random() < 0.2 ? 'Please handle with care.' : null,
        trackingNumber,
        trackingUrl,
        estimatedDelivery,
        createdAt: orderDate,
        updatedAt: new Date(orderDate.getTime() + Math.floor(Math.random() * 2) * dayInMs), // 0-2 days after creation
      };

      await prisma.order.create({
        data: order,
      });

      orders.push(order);

      // Create order items
      for (const product of orderProducts) {
        // Random quantity 1-3
        const quantity = Math.floor(Math.random() * 3) + 1;
        // Properly convert Decimal to number
        const price = Number(product.price);

        // Snapshot of product data at time of order
        const productData = {
          name: product.name,
          price,
          orderedAt: orderDate.toISOString(),
        };

        const orderItem = {
          id: uuidv4(),
          orderId,
          productId: product.id,
          sellerId: product.sellerId,
          quantity,
          price,
          productData,
          createdAt: orderDate,
        };

        await prisma.orderItem.create({
          data: orderItem,
        });

        orderItems.push(orderItem);
      }

      // Create order status history
      // All orders have at least "PENDING" status initially
      const initialStatus = {
        id: uuidv4(),
        orderId,
        status: OrderStatus.PENDING,
        note: 'Order created',
        createdBy: null,
        createdAt: orderDate,
      };

      await prisma.orderStatusHistory.create({
        data: initialStatus,
      });

      orderStatuses.push(initialStatus);

      // Add payment status for orders that are paid
      if (paymentStatus) {
        const paymentDate = new Date(orderDate.getTime() + 1000 * 60 * 30); // 30 minutes after order creation

        const paymentStatusRecord = {
          id: uuidv4(),
          orderId,
          status: OrderStatus.PAID,
          note: `Payment received via ${paymentMethod}`,
          createdBy: null,
          createdAt: paymentDate,
        };

        await prisma.orderStatusHistory.create({
          data: paymentStatusRecord,
        });

        orderStatuses.push(paymentStatusRecord);
      }

      // Add processing status for applicable orders
      if (
        status === OrderStatus.PROCESSING ||
        status === OrderStatus.SHIPPED ||
        status === OrderStatus.DELIVERED
      ) {
        const processingDate = new Date(orderDate.getTime() + dayInMs); // 1 day after order

        const processingStatus = {
          id: uuidv4(),
          orderId,
          status: OrderStatus.PROCESSING,
          note: 'Order is being prepared',
          createdBy: null,
          createdAt: processingDate,
        };

        await prisma.orderStatusHistory.create({
          data: processingStatus,
        });

        orderStatuses.push(processingStatus);
      }

      // Add shipped status for applicable orders
      if (status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED) {
        const shippedDate = new Date(orderDate.getTime() + 3 * dayInMs); // 3 days after order

        const shippedStatus = {
          id: uuidv4(),
          orderId,
          status: OrderStatus.SHIPPED,
          note: trackingNumber
            ? `Order shipped with tracking number: ${trackingNumber}`
            : 'Order shipped',
          createdBy: null,
          createdAt: shippedDate,
        };

        await prisma.orderStatusHistory.create({
          data: shippedStatus,
        });

        orderStatuses.push(shippedStatus);
      }

      // Add delivered status for delivered orders
      if (status === OrderStatus.DELIVERED) {
        const deliveredDate = new Date(orderDate.getTime() + 7 * dayInMs); // 7 days after order

        const deliveredStatus = {
          id: uuidv4(),
          orderId,
          status: OrderStatus.DELIVERED,
          note: 'Order delivered successfully',
          createdBy: null,
          createdAt: deliveredDate,
        };

        await prisma.orderStatusHistory.create({
          data: deliveredStatus,
        });

        orderStatuses.push(deliveredStatus);
      }

      // Add cancelled status for cancelled orders
      if (status === OrderStatus.CANCELLED) {
        const cancelledDate = new Date(orderDate.getTime() + 2 * dayInMs); // 2 days after order

        const cancelledStatus = {
          id: uuidv4(),
          orderId,
          status: OrderStatus.CANCELLED,
          note: 'Order cancelled by customer',
          createdBy: customer.id,
          createdAt: cancelledDate,
        };

        await prisma.orderStatusHistory.create({
          data: cancelledStatus,
        });

        orderStatuses.push(cancelledStatus);
      }

      // Add refunded status for refunded orders
      if (status === OrderStatus.REFUNDED) {
        const refundedDate = new Date(orderDate.getTime() + 10 * dayInMs); // 10 days after order

        const refundedStatus = {
          id: uuidv4(),
          orderId,
          status: OrderStatus.REFUNDED,
          note: 'Order refunded due to customer request',
          createdBy: null,
          createdAt: refundedDate,
        };

        await prisma.orderStatusHistory.create({
          data: refundedStatus,
        });

        orderStatuses.push(refundedStatus);
      }
    }
  }

  console.log(
    `Seeded ${orders.length} orders with ${orderItems.length} order items and ${orderStatuses.length} status updates`,
  );

  return { orders, orderItems, orderStatuses };
}

export { seedOrders };
