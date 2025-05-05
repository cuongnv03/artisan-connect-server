import { PrismaClient, Prisma, ProductStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Define a type for the category names to enable proper indexing
type CategoryName =
  | 'Home Decor'
  | 'Furniture'
  | 'Textiles'
  | 'Ceramics'
  | 'Jewelry'
  | 'Traditional Crafts'
  | 'Sustainable Products';

async function seedProducts() {
  console.log('Seeding products...');

  // Get artisan users to create products for
  const artisanUsers = await prisma.user.findMany({
    where: {
      role: 'ARTISAN',
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  // Get categories to assign products to
  const categories = await prisma.category.findMany();

  // Product names by category
  const productNamesByCategory = {
    'Home Decor': [
      'Hand-painted Wall Hanging',
      'Decorative Mirror Frame',
      'Bamboo Table Lamp',
      'Ceramic Vase Set',
      'Wooden Wall Shelf',
      'Embroidered Throw Pillow',
      'Macramé Wall Art',
      'Carved Wooden Tray',
      'Lacquer Box with Inlay',
      'Handwoven Wall Basket',
      'Ceramic Incense Holder',
      'Recycled Glass Candle Holder',
    ],
    Furniture: [
      'Handcrafted Wooden Stool',
      'Bamboo Coffee Table',
      'Rattan Accent Chair',
      'Carved Wooden Bench',
      'Reclaimed Wood Side Table',
      'Lacquered Cabinet',
      'Bamboo Folding Screen',
      'Wooden Dining Chair',
      'Rattan Storage Basket',
      'Sustainable Teak Table',
      'Bamboo Bookshelf',
      'Handmade Rocking Chair',
    ],
    Textiles: [
      'Hand-embroidered Table Runner',
      'Traditional Silk Scarf',
      'Handwoven Cotton Blanket',
      'Batik Fabric Wall Hanging',
      'Natural Dyed Pillow Cover',
      'Embroidered Tea Towel Set',
      'Hmong Traditional Tapestry',
      'Handwoven Floor Mat',
      'Indigo Dyed Table Cloth',
      'Silk Brocade Cushion Cover',
      'Handspun Cotton Throw',
      'Embroidered Wall Art',
    ],
    Ceramics: [
      'Handthrown Ceramic Platter',
      'Traditional Tea Set',
      'Stoneware Dinner Plates',
      'Decorative Ceramic Bowl',
      'Clay Flower Pot',
      'Ceramic Serving Dish',
      'Handpainted Ceramic Mug',
      'Pottery Vase',
      'Ceramic Wall Art',
      'Stoneware Kitchen Canisters',
      'Pottery Fruit Bowl',
      'Ceramic Wind Chimes',
    ],
    Jewelry: [
      'Silver Ethnic Necklace',
      'Hand-forged Copper Bracelet',
      'Ceramic Bead Earrings',
      'Traditional Hmong Silver Ring',
      'Woven Textile Bracelet',
      'Lacquered Wood Pendant',
      'Tribal Silver Earrings',
      'Handcrafted Gemstone Ring',
      'Embroidered Textile Necklace',
      'Hammered Brass Cuff',
      'Natural Stone Pendant',
      'Bamboo Hoop Earrings',
    ],
    'Traditional Crafts': [
      'Lacquered Decorative Box',
      'Hand-carved Wooden Mask',
      'Traditional Bamboo Basket',
      'Handmade Paper Lantern',
      'Carved Stone Sculpture',
      'Traditional Kite',
      'Handwoven Bamboo Hat',
      'Silk Embroidery Art',
      'Traditional Musical Instrument',
      'Hand-painted Lacquer Bowl',
      'Woven Rattan Tray',
      'Traditional Puppet',
    ],
    'Sustainable Products': [
      'Recycled Plastic Woven Basket',
      'Sustainable Bamboo Utensils',
      'Upcycled Fabric Tote Bag',
      'Coconut Shell Bowl',
      'Recycled Glass Tumbler',
      'Natural Fiber Market Bag',
      'Banana Leaf Woven Mat',
      'Recycled Paper Notebook',
      'Sustainable Bamboo Toothbrush',
      'Upcycled Textile Rug',
      'Natural Loofah Kitchen Scrubber',
      'Recycled Sari Fabric Garland',
    ],
  };

  // Product descriptions - varied by type
  const productDescriptions = [
    'Handcrafted by skilled artisans using traditional techniques passed down through generations. Each piece is unique and showcases the rich cultural heritage of Vietnam.',
    'Made entirely by hand in small batches, this item represents hours of careful craftsmanship. The natural variations in the material make each piece one-of-a-kind.',
    'This authentic handmade item combines traditional skills with contemporary design. Perfect for adding a touch of artisanal charm to your home.',
    'Created using age-old techniques in a small workshop in northern Vietnam. This piece represents both cultural preservation and sustainable production.',
    "Meticulously handcrafted from locally sourced materials. The intricate details showcase the artisan's exceptional skill and attention to detail.",
    'This unique piece is handmade by master craftspeople who have perfected their art over decades of practice. Each item tells a story of cultural heritage and artistic excellence.',
    'Handcrafted with care using sustainable materials and traditional methods. This piece bridges the gap between ancient craft techniques and modern aesthetics.',
    'Made by hand in a small village workshop where craftsmanship has been a way of life for centuries. Each piece carries the authentic spirit of Vietnamese artistic tradition.',
    'This handcrafted item exemplifies the perfect blend of functionality and beauty. Created with natural materials using techniques refined over generations.',
    'Meticulously made by expert hands, this piece showcases traditional Vietnamese craft at its finest. Every detail reflects years of practiced skill.',
  ];

  const products = [];
  const categoryProducts = [];

  // Create 10-15 products for each artisan
  for (const artisan of artisanUsers) {
    // Random number of products between 10-15
    const numProducts = Math.floor(Math.random() * 6) + 10;

    for (let i = 0; i < numProducts; i++) {
      // Select a random category from main categories
      const mainCategories = categories.filter((cat) => cat.level === 0);
      const mainCategory = mainCategories[Math.floor(Math.random() * mainCategories.length)];

      // Find subcategories for this main category
      const subcategories = categories.filter((cat) => cat.parentId === mainCategory.id);
      let subcategory = null;
      if (subcategories.length > 0 && Math.random() > 0.3) {
        subcategory = subcategories[Math.floor(Math.random() * subcategories.length)];
      }

      // Select a random product name based on category
      const categoryNames = productNamesByCategory[mainCategory.name as CategoryName] || [];
      let productName = categoryNames[Math.floor(Math.random() * categoryNames.length)];
      if (!productName) {
        productName = `Handcrafted ${mainCategory.name} Item`;
      }

      // Add some variation to make names unique
      const variations = [
        'Small',
        'Large',
        'Rustic',
        'Modern',
        'Traditional',
        'Decorative',
        'Elegant',
        'Minimalist',
        'Vintage',
        'Classic',
      ];
      const colors = [
        'Natural',
        'Brown',
        'Black',
        'White',
        'Blue',
        'Green',
        'Red',
        'Yellow',
        'Multi-colored',
        'Earth-toned',
      ];

      if (Math.random() > 0.5) {
        productName = `${variations[Math.floor(Math.random() * variations.length)]} ${productName}`;
      }

      if (Math.random() > 0.7) {
        productName = `${productName} - ${colors[Math.floor(Math.random() * colors.length)]}`;
      }

      // Generate a slug from the name
      const slug = productName
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');

      // Random price between $15 and $500
      const price = Math.floor(Math.random() * 48500) + 1500; // 15.00 to 500.00

      // 30% chance of having a discount
      const hasDiscount = Math.random() < 0.3;
      const discountPercentage = hasDiscount ? Math.floor(Math.random() * 30) + 5 : 0; // 5% to 35%
      const discountPrice = hasDiscount ? price - price * (discountPercentage / 100) : null;

      // Random quantity in stock
      const quantity = Math.floor(Math.random() * 30) + 1;

      // Random SKU
      const sku = `${mainCategory.name.substring(0, 3).toUpperCase()}-${Math.floor(
        Math.random() * 10000,
      )
        .toString()
        .padStart(4, '0')}`;

      // Random dimensions
      const dimensions = {
        length: Math.floor(Math.random() * 90) + 10,
        width: Math.floor(Math.random() * 60) + 5,
        height: Math.floor(Math.random() * 40) + 5,
      };

      // Product status
      let status: ProductStatus;
      const randomStatus = Math.random();
      if (randomStatus < 0.7) {
        status = ProductStatus.PUBLISHED;
      } else if (randomStatus < 0.85) {
        status = ProductStatus.DRAFT;
      } else if (randomStatus < 0.95) {
        status = quantity > 0 ? ProductStatus.PUBLISHED : ProductStatus.OUT_OF_STOCK;
      } else {
        status = ProductStatus.DISCONTINUED;
      }

      // Random product images
      const numImages = Math.floor(Math.random() * 3) + 1;
      const images = [];
      for (let j = 0; j < numImages; j++) {
        images.push(`https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/600`);
      }

      // Random tags - properly typed
      const allTags = [
        'handmade',
        'traditional',
        'vietnamese',
        'artisan',
        'sustainable',
        'eco-friendly',
        'home decor',
        'gift',
        'unique',
        'custom',
        'natural materials',
        'limited edition',
      ];
      const numTags = Math.floor(Math.random() * 5) + 1;
      const tags: string[] = [];
      for (let j = 0; j < numTags; j++) {
        const tag = allTags[Math.floor(Math.random() * allTags.length)];
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      }

      // Random attributes based on category
      const attributes: Record<string, string | string[]> = {};

      if (mainCategory.name === 'Furniture' || mainCategory.name === 'Home Decor') {
        attributes['materials'] = ['wood', 'bamboo', 'rattan', 'metal', 'ceramic'][
          Math.floor(Math.random() * 5)
        ];
        attributes['style'] = ['traditional', 'modern', 'rustic', 'minimalist', 'eclectic'][
          Math.floor(Math.random() * 5)
        ];
      } else if (mainCategory.name === 'Textiles') {
        attributes['material'] = ['cotton', 'silk', 'wool', 'hemp', 'linen'][
          Math.floor(Math.random() * 5)
        ];
        attributes['technique'] = ['handwoven', 'embroidered', 'appliqué', 'batik', 'ikat'][
          Math.floor(Math.random() * 5)
        ];
      } else if (mainCategory.name === 'Ceramics') {
        attributes['clay_type'] = ['stoneware', 'porcelain', 'earthenware', 'terracotta'][
          Math.floor(Math.random() * 4)
        ];
        attributes['firing'] = ['high-fire', 'mid-range', 'low-fire', 'wood-fired', 'salt-glazed'][
          Math.floor(Math.random() * 5)
        ];
      } else if (mainCategory.name === 'Jewelry') {
        attributes['material'] = ['silver', 'copper', 'brass', 'gemstones', 'textile', 'wood'][
          Math.floor(Math.random() * 6)
        ];
        attributes['technique'] = ['hand-forged', 'cast', 'wire-wrapped', 'beaded', 'filigree'][
          Math.floor(Math.random() * 5)
        ];
      }

      // Use Prisma.JsonNull when attributes or dimensions are empty
      const finalAttributes = Object.keys(attributes).length > 0 ? attributes : Prisma.JsonNull;

      // 30% chance of being customizable
      const isCustomizable = Math.random() < 0.3;

      // Rating and review count if the product has been published for a while
      let avgRating = null;
      let reviewCount = 0;

      if (status === ProductStatus.PUBLISHED && Math.random() < 0.7) {
        reviewCount = Math.floor(Math.random() * 50) + 1;
        avgRating = parseFloat((Math.random() * 2 + 3).toFixed(1)); // 3.0 to 5.0
      }

      // Create the product
      const productId = uuidv4();

      const product = {
        id: productId,
        sellerId: artisan.id,
        name: productName,
        slug: `${slug}-${productId.substring(0, 8)}`,
        description: productDescriptions[Math.floor(Math.random() * productDescriptions.length)],
        price: price / 100, // Convert to decimal
        discountPrice: discountPrice ? discountPrice / 100 : null,
        quantity,
        sku,
        weight: Math.floor(Math.random() * 1000) + 100, // 100g to 1100g
        dimensions, // No need for Prisma.JsonNull since dimensions is always populated
        status,
        images,
        tags,
        attributes: finalAttributes,
        isCustomizable,
        avgRating,
        reviewCount,
        viewCount: Math.floor(Math.random() * 500),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000),
      };

      // Create the product
      await prisma.product.create({
        data: product,
      });

      products.push(product);

      // Create category associations
      if (mainCategory) {
        await prisma.categoryProduct.create({
          data: {
            categoryId: mainCategory.id,
            productId: productId,
          },
        });

        categoryProducts.push({
          categoryId: mainCategory.id,
          productId: productId,
        });
      }

      if (subcategory) {
        await prisma.categoryProduct.create({
          data: {
            categoryId: subcategory.id,
            productId: productId,
          },
        });

        categoryProducts.push({
          categoryId: subcategory.id,
          productId: productId,
        });
      }
    }
  }

  console.log(
    `Seeded ${products.length} products with ${categoryProducts.length} category associations`,
  );

  return { products, categoryProducts };
}

export { seedProducts };
