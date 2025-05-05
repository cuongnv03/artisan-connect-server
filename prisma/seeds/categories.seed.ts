import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedCategories() {
  console.log('Seeding categories...');

  const categories = [
    {
      id: uuidv4(),
      name: 'Home Decor',
      slug: 'home-decor',
      description: 'Beautiful handcrafted items to enhance your living space',
      imageUrl: 'https://picsum.photos/id/20/800/600',
      parentId: null,
      level: 0,
      sortOrder: 1,
    },
    {
      id: uuidv4(),
      name: 'Furniture',
      slug: 'furniture',
      description: 'Handmade furniture crafted with traditional techniques',
      imageUrl: 'https://picsum.photos/id/21/800/600',
      parentId: null,
      level: 0,
      sortOrder: 2,
    },
    {
      id: uuidv4(),
      name: 'Textiles',
      slug: 'textiles',
      description: 'Handwoven and embroidered textiles from traditional artisans',
      imageUrl: 'https://picsum.photos/id/22/800/600',
      parentId: null,
      level: 0,
      sortOrder: 3,
    },
    {
      id: uuidv4(),
      name: 'Ceramics',
      slug: 'ceramics',
      description: 'Handcrafted pottery and ceramic artworks',
      imageUrl: 'https://picsum.photos/id/23/800/600',
      parentId: null,
      level: 0,
      sortOrder: 4,
    },
    {
      id: uuidv4(),
      name: 'Jewelry',
      slug: 'jewelry',
      description: 'Handmade jewelry featuring traditional and contemporary designs',
      imageUrl: 'https://picsum.photos/id/24/800/600',
      parentId: null,
      level: 0,
      sortOrder: 5,
    },
    {
      id: uuidv4(),
      name: 'Traditional Crafts',
      slug: 'traditional-crafts',
      description: 'Authentic Vietnamese crafts preserving cultural heritage',
      imageUrl: 'https://picsum.photos/id/25/800/600',
      parentId: null,
      level: 0,
      sortOrder: 6,
    },
    {
      id: uuidv4(),
      name: 'Sustainable Products',
      slug: 'sustainable-products',
      description: 'Eco-friendly handcrafted items made with sustainable materials',
      imageUrl: 'https://picsum.photos/id/26/800/600',
      parentId: null,
      level: 0,
      sortOrder: 7,
    },
  ];

  // Subcategories will be added to main categories
  const subcategories = [
    // Home Decor subcategories
    {
      id: uuidv4(),
      name: 'Wall Art',
      slug: 'wall-art',
      description: 'Handcrafted wall decorations and art pieces',
      imageUrl: 'https://picsum.photos/id/30/800/600',
      parentCategory: 'Home Decor',
      level: 1,
      sortOrder: 1,
    },
    {
      id: uuidv4(),
      name: 'Vases & Containers',
      slug: 'vases-containers',
      description: 'Handmade vessels for display or functional use',
      imageUrl: 'https://picsum.photos/id/31/800/600',
      parentCategory: 'Home Decor',
      level: 1,
      sortOrder: 2,
    },
    {
      id: uuidv4(),
      name: 'Decorative Accents',
      slug: 'decorative-accents',
      description: 'Small handcrafted items to accent your home',
      imageUrl: 'https://picsum.photos/id/32/800/600',
      parentCategory: 'Home Decor',
      level: 1,
      sortOrder: 3,
    },

    // Furniture subcategories
    {
      id: uuidv4(),
      name: 'Tables',
      slug: 'tables',
      description: 'Handcrafted tables for every room',
      imageUrl: 'https://picsum.photos/id/33/800/600',
      parentCategory: 'Furniture',
      level: 1,
      sortOrder: 1,
    },
    {
      id: uuidv4(),
      name: 'Seating',
      slug: 'seating',
      description: 'Handmade chairs, stools, and benches',
      imageUrl: 'https://picsum.photos/id/34/800/600',
      parentCategory: 'Furniture',
      level: 1,
      sortOrder: 2,
    },
    {
      id: uuidv4(),
      name: 'Storage',
      slug: 'storage',
      description: 'Cabinets, shelves, and storage solutions',
      imageUrl: 'https://picsum.photos/id/35/800/600',
      parentCategory: 'Furniture',
      level: 1,
      sortOrder: 3,
    },

    // Textiles subcategories
    {
      id: uuidv4(),
      name: 'Tapestries',
      slug: 'tapestries',
      description: 'Hand-woven wall hangings and tapestries',
      imageUrl: 'https://picsum.photos/id/36/800/600',
      parentCategory: 'Textiles',
      level: 1,
      sortOrder: 1,
    },
    {
      id: uuidv4(),
      name: 'Rugs & Carpets',
      slug: 'rugs-carpets',
      description: 'Handwoven floor coverings in traditional and modern designs',
      imageUrl: 'https://picsum.photos/id/37/800/600',
      parentCategory: 'Textiles',
      level: 1,
      sortOrder: 2,
    },
    {
      id: uuidv4(),
      name: 'Bedding & Pillows',
      slug: 'bedding-pillows',
      description: 'Handcrafted textiles for your bedroom',
      imageUrl: 'https://picsum.photos/id/38/800/600',
      parentCategory: 'Textiles',
      level: 1,
      sortOrder: 3,
    },

    // Ceramics subcategories
    {
      id: uuidv4(),
      name: 'Tableware',
      slug: 'tableware',
      description: 'Handcrafted plates, bowls, and dining accessories',
      imageUrl: 'https://picsum.photos/id/39/800/600',
      parentCategory: 'Ceramics',
      level: 1,
      sortOrder: 1,
    },
    {
      id: uuidv4(),
      name: 'Decorative Ceramics',
      slug: 'decorative-ceramics',
      description: 'Ceramic art pieces and sculptures',
      imageUrl: 'https://picsum.photos/id/40/800/600',
      parentCategory: 'Ceramics',
      level: 1,
      sortOrder: 2,
    },

    // Jewelry subcategories
    {
      id: uuidv4(),
      name: 'Necklaces',
      slug: 'necklaces',
      description: 'Handcrafted necklaces in various styles',
      imageUrl: 'https://picsum.photos/id/41/800/600',
      parentCategory: 'Jewelry',
      level: 1,
      sortOrder: 1,
    },
    {
      id: uuidv4(),
      name: 'Earrings',
      slug: 'earrings',
      description: 'Handmade earrings from traditional artisans',
      imageUrl: 'https://picsum.photos/id/42/800/600',
      parentCategory: 'Jewelry',
      level: 1,
      sortOrder: 2,
    },
    {
      id: uuidv4(),
      name: 'Bracelets',
      slug: 'bracelets',
      description: 'Handcrafted bracelets and bangles',
      imageUrl: 'https://picsum.photos/id/43/800/600',
      parentCategory: 'Jewelry',
      level: 1,
      sortOrder: 3,
    },

    // Traditional Crafts subcategories
    {
      id: uuidv4(),
      name: 'Lacquerware',
      slug: 'lacquerware',
      description: 'Traditional Vietnamese lacquered items',
      imageUrl: 'https://picsum.photos/id/44/800/600',
      parentCategory: 'Traditional Crafts',
      level: 1,
      sortOrder: 1,
    },
    {
      id: uuidv4(),
      name: 'Bamboo Crafts',
      slug: 'bamboo-crafts',
      description: 'Items handcrafted from bamboo using traditional techniques',
      imageUrl: 'https://picsum.photos/id/45/800/600',
      parentCategory: 'Traditional Crafts',
      level: 1,
      sortOrder: 2,
    },
    {
      id: uuidv4(),
      name: 'Paper Crafts',
      slug: 'paper-crafts',
      description: 'Traditional Vietnamese paper art and crafts',
      imageUrl: 'https://picsum.photos/id/46/800/600',
      parentCategory: 'Traditional Crafts',
      level: 1,
      sortOrder: 3,
    },

    // Sustainable Products subcategories
    {
      id: uuidv4(),
      name: 'Recycled Materials',
      slug: 'recycled-materials',
      description: 'Products made from recycled and upcycled materials',
      imageUrl: 'https://picsum.photos/id/47/800/600',
      parentCategory: 'Sustainable Products',
      level: 1,
      sortOrder: 1,
    },
    {
      id: uuidv4(),
      name: 'Natural Materials',
      slug: 'natural-materials',
      description: 'Eco-friendly products made from natural, sustainable sources',
      imageUrl: 'https://picsum.photos/id/48/800/600',
      parentCategory: 'Sustainable Products',
      level: 1,
      sortOrder: 2,
    },
  ];

  // First create main categories
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  // Then create subcategories
  for (const subcategory of subcategories) {
    const parentCategory = await prisma.category.findFirst({
      where: { name: subcategory.parentCategory },
      select: { id: true },
    });

    if (parentCategory) {
      const { parentCategory: _, ...subcategoryData } = subcategory;

      await prisma.category.upsert({
        where: { slug: subcategoryData.slug },
        update: { ...subcategoryData, parentId: parentCategory.id },
        create: { ...subcategoryData, parentId: parentCategory.id },
      });
    }
  }

  console.log(
    `Seeded ${categories.length} main categories and ${subcategories.length} subcategories`,
  );

  return { categories, subcategories };
}

export { seedCategories };
