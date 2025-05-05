import { PrismaClient, Prisma, UpgradeRequestStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedUpgradeRequests() {
  console.log('Seeding artisan upgrade requests...');

  // Get some customer users to create upgrade requests for
  const customerUsers = await prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
    take: 5,
    select: { id: true },
  });

  // Get an admin for reviewing requests
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  const shopNames = [
    'Handmade Haven',
    'Crafty Creations',
    'Artisan Workshop',
    'Traditional Treasures',
    'Craft Corner',
    'Heritage Handcrafts',
    'Artistic Endeavors',
    'Cultural Crafts',
    'Bamboo & Beyond',
    'Textile Traditions',
    'Ceramic Stories',
    'Wood & Wonder',
  ];

  const specialtiesSets = [
    ['woodworking', 'furniture making', 'wood carving'],
    ['pottery', 'ceramic art', 'sculpture'],
    ['textile art', 'embroidery', 'weaving'],
    ['jewelry making', 'silver work', 'gemstone setting'],
    ['bamboo crafts', 'basket weaving', 'sustainable products'],
    ['lacquerware', 'traditional Vietnamese crafts'],
    ['paper crafts', 'calligraphy', 'handmade cards'],
    ['leather work', 'bag making', 'accessories'],
    ['natural dyeing', 'batik', 'fabric painting'],
    ['metal work', 'blacksmithing', 'decorative ironwork'],
  ];

  const statuses = [
    UpgradeRequestStatus.PENDING,
    UpgradeRequestStatus.APPROVED,
    UpgradeRequestStatus.REJECTED,
  ];

  const reasons = [
    "I've been practicing my craft for over 5 years and would like to reach a wider audience through your platform.",
    "My handmade products have been selling well at local markets, and I'm ready to expand my business online.",
    'I come from a family with a long tradition in this craft, and I want to preserve and share our heritage.',
    "I've completed formal training in my craft and am looking for a platform to showcase my skills.",
    "I've been selling my work on other platforms but believe ArtCraft would be a better fit for my traditional Vietnamese products.",
    'I want to connect with customers who appreciate handmade quality and traditional techniques.',
    "I'm passionate about sustainable crafting and want to reach environmentally conscious consumers.",
    "I'm looking to turn my hobby into a business and believe your platform is the perfect place to start.",
    'I create unique pieces that blend traditional techniques with modern design and want to reach the right audience.',
    "I've received positive feedback on my work and am ready to take the next step in my artisanal journey.",
  ];

  const adminNotes = [
    'High-quality work with excellent attention to detail. Photos show consistent craftsmanship.',
    'Traditional techniques with a modern approach. Good fit for our platform.',
    'Impressive portfolio with strong cultural roots. Approved.',
    'Meets all criteria for artisan status. Welcome aboard!',
    'Application shows dedication to craft and sustainability. Approved.',
    'Quality standards not quite meeting our requirements. Suggest reapplying after refining techniques.',
    'Insufficient portfolio examples. Need to see more variety in work.',
    'Products appear mass-produced rather than handcrafted. Not aligned with our platform focus.',
    'Concerns about authenticity of traditional techniques claimed. Please provide more documentation.',
    "Specialties don't currently align with our platform categories. Consider reapplying when we expand.",
  ];

  const upgradeRequests = [];

  // Create a mix of requests with different statuses
  for (let i = 0; i < customerUsers.length; i++) {
    const userId = customerUsers[i].id;

    // Check if request already exists
    const existingRequest = await prisma.artisanUpgradeRequest.findUnique({
      where: { userId },
    });

    if (!existingRequest) {
      const status = statuses[Math.min(i, statuses.length - 1)]; // Distribute statuses
      const shopName = shopNames[Math.floor(Math.random() * shopNames.length)];
      const specialties = specialtiesSets[Math.floor(Math.random() * specialtiesSets.length)];
      const experience = Math.floor(Math.random() * 15) + 1;
      const reason = reasons[Math.floor(Math.random() * reasons.length)];

      // Fix JSON field
      const socialMedia: Record<string, string | null> = {};
      if (Math.random() < 0.6)
        socialMedia['instagram'] =
          `https://instagram.com/craft_${Math.random().toString(36).substring(7)}`;
      if (Math.random() < 0.6)
        socialMedia['facebook'] =
          `https://facebook.com/craft_${Math.random().toString(36).substring(7)}`;

      // Use Prisma.JsonNull when socialMedia is empty
      const finalSocialMedia = Object.keys(socialMedia).length > 0 ? socialMedia : Prisma.JsonNull;

      // Admin notes only for approved/rejected
      let reviewedBy = null;
      let adminNote = null;

      if (status !== UpgradeRequestStatus.PENDING) {
        reviewedBy = admin?.id || null;
        adminNote = adminNotes[Math.floor(Math.random() * adminNotes.length)];
      }

      if (status !== UpgradeRequestStatus.PENDING) {
        reviewedBy = admin?.id || null;
        adminNote = adminNotes[Math.floor(Math.random() * adminNotes.length)];
      }

      // Create the base object with all properties including updatedAt
      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);

      // Define updatedAt based on status
      const updatedAt =
        status !== UpgradeRequestStatus.PENDING
          ? new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000)
          : createdAt; // Same as createdAt for pending requests

      const request = {
        id: uuidv4(),
        userId,
        shopName,
        shopDescription: `A workshop dedicated to creating ${specialties.join(', ')} with traditional techniques and modern aesthetics.`,
        specialties,
        experience,
        website:
          Math.random() < 0.4 ? `https://${shopName.toLowerCase().replace(/\s+/g, '')}.com` : null,
        socialMedia: finalSocialMedia,
        reason,
        status,
        adminNotes: adminNote,
        reviewedBy,
        createdAt,
        updatedAt, // Include updatedAt in the initial object
      };

      await prisma.artisanUpgradeRequest.create({
        data: request,
      });

      upgradeRequests.push(request);
    }
  }

  console.log(`Seeded ${upgradeRequests.length} artisan upgrade requests`);

  return upgradeRequests;
}

export { seedUpgradeRequests };
