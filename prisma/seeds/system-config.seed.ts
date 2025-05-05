import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedSystemConfig() {
  console.log('Seeding system config...');

  const configs = [
    {
      id: uuidv4(),
      key: 'site.name',
      value: 'ArtisanConnect',
      description: 'Site name displayed throughout the application',
    },
    {
      id: uuidv4(),
      key: 'site.description',
      value: 'A platform connecting traditional Vietnamese artisans with customers worldwide',
      description: 'Site description used in SEO and about pages',
    },
    {
      id: uuidv4(),
      key: 'site.logo',
      value: 'https://example.com/images/logo.png',
      description: 'Main site logo URL',
    },
    {
      id: uuidv4(),
      key: 'site.favicon',
      value: 'https://example.com/images/favicon.ico',
      description: 'Site favicon URL',
    },
    {
      id: uuidv4(),
      key: 'email.templates.welcome',
      value: {
        subject: 'Welcome to ArtisanConnect',
        body: "<h1>Welcome!</h1><p>Thank you for joining ArtisanConnect. We're excited to have you here.</p>",
      },
      description: 'Welcome email template sent to new users',
    },
    {
      id: uuidv4(),
      key: 'email.templates.orderConfirmation',
      value: {
        subject: 'Your Order Confirmation',
        body: '<h1>Order Confirmed</h1><p>Thank you for your order. Here are your order details:</p>{{orderDetails}}',
      },
      description: 'Order confirmation email template',
    },
    {
      id: uuidv4(),
      key: 'email.templates.passwordReset',
      value: {
        subject: 'Reset Your Password',
        body: '<h1>Password Reset</h1><p>Click the link below to reset your password:</p><a href="{{resetLink}}">Reset Password</a>',
      },
      description: 'Password reset email template',
    },
    {
      id: uuidv4(),
      key: 'social.links',
      value: {
        facebook: 'https://facebook.com/artisanconnect',
        instagram: 'https://instagram.com/artisanconnect',
        twitter: 'https://twitter.com/artisanconnect',
      },
      description: 'Social media links displayed in footer',
    },
    {
      id: uuidv4(),
      key: 'payment.methods',
      value: ['credit_card', 'paypal', 'bank_transfer'],
      description: 'Available payment methods',
    },
    {
      id: uuidv4(),
      key: 'shipping.countries',
      value: [
        'Vietnam',
        'United States',
        'Canada',
        'United Kingdom',
        'Australia',
        'France',
        'Germany',
        'Japan',
        'Singapore',
      ],
      description: 'Countries available for shipping',
    },
    {
      id: uuidv4(),
      key: 'product.categories',
      value: ['Ceramics', 'Woodworking', 'Textiles', 'Jewelry', 'Bamboo', 'Lacquerware'],
      description: 'Main product categories',
    },
    {
      id: uuidv4(),
      key: 'feature.flags',
      value: {
        enableReviews: true,
        enableBlog: true,
        enableCustomization: true,
        enableQuotes: true,
        enableArtisanProfiles: true,
      },
      description: 'Feature flags to enable/disable functionality',
    },
  ];

  const createdConfigs = [];

  for (const config of configs) {
    // Check if config already exists
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { key: config.key },
    });

    if (!existingConfig) {
      // Create config
      const createdConfig = await prisma.systemConfig.create({
        data: {
          id: config.id,
          key: config.key,
          value: config.value as any,
          description: config.description,
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      createdConfigs.push(createdConfig);
    }
  }

  console.log(`Seeded ${createdConfigs.length} system configs`);

  return createdConfigs;
}

export { seedSystemConfig };
