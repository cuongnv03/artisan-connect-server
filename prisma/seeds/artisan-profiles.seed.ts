import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedArtisanProfiles() {
  console.log('Seeding artisan profiles...');

  // Get all users with ARTISAN role
  const artisanUsers = await prisma.user.findMany({
    where: {
      role: 'ARTISAN',
      status: 'ACTIVE',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  // Sample craft specialties
  const specialties = [
    ['woodworking', 'furniture', 'carving'],
    ['ceramics', 'pottery', 'sculpture'],
    ['textiles', 'embroidery', 'weaving'],
    ['jewelry', 'silverwork', 'gemstones'],
    ['bamboo crafts', 'sustainable products'],
    ['traditional Vietnamese crafts', 'lacquerware'],
    ['paper crafts', 'painting', 'calligraphy'],
    ['leather work', 'bags', 'accessories'],
    ['glasswork', 'blown glass', 'decorative items'],
    ['metal work', 'ironwork', 'copper art'],
    ['textile dyeing', 'batik', 'natural dyes'],
  ];

  const shopDescriptions = [
    'My workshop focuses on blending traditional techniques with contemporary designs. Each piece reflects Vietnamese heritage while serving modern needs.',
    'I create functional art that brings beauty to everyday objects. All my pieces are handcrafted with attention to detail and sustainability in mind.',
    "Drawing inspiration from Vietnam's rich cultural heritage, my creations combine ancestral knowledge with innovative approaches to craft.",
    "My family has been practicing this craft for three generations. I'm proud to continue the tradition while bringing my own vision to the work.",
    'Each piece tells a story of our cultural heritage. I work exclusively with local materials and traditional methods passed down through generations.',
    "My workshop specializes in reviving forgotten techniques of Northern Vietnam's craft villages. I collaborate with local artisans to preserve this knowledge.",
    'I believe in sustainable craftsmanship. All materials are locally sourced and ecologically responsible, with minimal waste in production.',
    'My journey in artisanal crafts began 15 years ago. Today I focus on creating pieces that honor tradition while embracing contemporary aesthetics.',
    'As a master craftsperson, I dedicate myself to teaching the next generation while continuing to create museum-quality pieces for collectors worldwide.',
    'My work celebrates the intersection of craft traditions across Southeast Asia, creating cultural dialogues through handmade objects.',
  ];

  const artisanProfiles = [];

  for (const user of artisanUsers) {
    // Check if profile already exists
    const existingProfile = await prisma.artisanProfile.findUnique({
      where: { userId: user.id },
    });

    if (!existingProfile) {
      // Generate unique shop name based on user's name
      const shopName = `${user.firstName}'s ${['Atelier', 'Workshop', 'Studio', 'Craft House', 'Artisan Space'][Math.floor(Math.random() * 5)]}`;

      // Random selection of specialties (2-4)
      const userSpecialties = specialties[Math.floor(Math.random() * specialties.length)];

      // Random shop description
      const shopDescription = shopDescriptions[Math.floor(Math.random() * shopDescriptions.length)];

      // Random experience years (3-30)
      const experience = Math.floor(Math.random() * 27) + 3;

      // Social media with 70% chance for each platform
      const socialMedia: Record<string, string | null> = {};
      if (Math.random() < 0.7)
        socialMedia['instagram'] =
          `https://instagram.com/${user.firstName.toLowerCase()}${user.lastName.toLowerCase()}crafts`;
      if (Math.random() < 0.7)
        socialMedia['facebook'] =
          `https://facebook.com/${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}.crafts`;
      if (Math.random() < 0.5)
        socialMedia['etsy'] = `https://etsy.com/shop/${user.firstName}${user.lastName}Crafts`;

      // Use Prisma.JsonNull when socialMedia is empty
      const finalSocialMedia = Object.keys(socialMedia).length > 0 ? socialMedia : Prisma.JsonNull;

      // Fix template data
      const templateData =
        Math.random() < 0.7
          ? {
              colorPalette: {
                primary: ['#e63946', '#457b9d', '#606c38', '#2a9d8f'][
                  Math.floor(Math.random() * 4)
                ],
                secondary: ['#f1faee', '#fefae0', '#e9c46a', '#f8f9fa'][
                  Math.floor(Math.random() * 4)
                ],
                accent: ['#a8dadc', '#dda15e', '#f4a261', '#e63946'][Math.floor(Math.random() * 4)],
              },
              layout: ['standard', 'portfolio', 'storefront', 'blog'][
                Math.floor(Math.random() * 4)
              ],
              fonts: {
                heading: [
                  'Montserrat, sans-serif',
                  'Playfair Display, serif',
                  'Abril Fatface, cursive',
                  'Poppins, sans-serif',
                ][Math.floor(Math.random() * 4)],
                body: [
                  'Open Sans, sans-serif',
                  'Merriweather, serif',
                  'Lora, serif',
                  'Work Sans, sans-serif',
                ][Math.floor(Math.random() * 4)],
              },
            }
          : Prisma.JsonNull;

      // Rating (if there are reviews)
      const hasRating = Math.random() < 0.8;
      const rating = hasRating ? Math.floor(Math.random() * 15 + 35) / 10 : null; // 3.5 - 5.0
      const reviewCount = hasRating ? Math.floor(Math.random() * 150) + 5 : 0;

      const profile = {
        id: uuidv4(),
        userId: user.id,
        shopName,
        shopDescription,
        shopLogoUrl:
          Math.random() < 0.8
            ? `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/200/200`
            : null,
        shopBannerUrl:
          Math.random() < 0.7
            ? `https://picsum.photos/id/${Math.floor(Math.random() * 100) + 100}/1200/300`
            : null,
        specialties: userSpecialties,
        experience,
        website:
          Math.random() < 0.6
            ? `https://${user.firstName.toLowerCase()}${user.lastName.toLowerCase()}.crafts.com`
            : null,
        contactEmail: `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}@gmail.com`,
        contactPhone: `+84${Math.floor(Math.random() * 900000000) + 100000000}`,
        socialMedia: finalSocialMedia,
        templateId:
          Math.random() < 0.7
            ? `template-${['traditional', 'modern', 'artistic', 'minimalist'][Math.floor(Math.random() * 4)]}`
            : null,
        templateData: templateData,
        isVerified: Math.random() < 0.7,
        rating,
        reviewCount,
      };

      await prisma.artisanProfile.create({
        data: profile,
      });

      artisanProfiles.push(profile);
    }
  }

  console.log(`Seeded ${artisanProfiles.length} artisan profiles`);

  return artisanProfiles;
}

export { seedArtisanProfiles };
