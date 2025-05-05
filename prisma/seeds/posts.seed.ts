import { PrismaClient, Prisma, PostType, PostStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Define type interfaces for content blocks
interface BaseBlock {
  type: string;
}

interface TextBlock extends BaseBlock {
  type: 'paragraph' | 'heading' | 'tip';
  content: string;
}

interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  caption: string;
}

interface ListBlock extends BaseBlock {
  type: 'list' | 'features' | 'details';
  items: string[];
}

type ContentBlock = TextBlock | ImageBlock | ListBlock;

async function seedPosts() {
  console.log('Seeding posts...');

  // Get artisan users to create posts for
  const artisanUsers = await prisma.user.findMany({
    where: {
      role: 'ARTISAN',
      status: 'ACTIVE',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      artisanProfile: {
        select: {
          id: true,
          shopName: true,
          specialties: true,
        },
      },
    },
  });

  // Get products to mention in posts
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, sellerId: true, name: true },
  });

  // Post titles for different types
  const postTitles = {
    STORY: [
      'My Journey as a Traditional Vietnamese Craftsperson',
      'How I Found My Passion for Artisanal Craft',
      'From Apprentice to Master: My Craft Evolution',
      "Preserving Heritage: The Story of My Family's Craft",
      'Connecting with My Cultural Roots Through Craft',
      'The Village Where My Craft Was Born',
      "My Inspiration: Nature's Influence on My Work",
      'Finding Balance Between Tradition and Innovation',
      'The Spiritual Dimension of Traditional Craftsmanship',
      'Why I Dedicated My Life to Preserving This Ancient Craft',
    ],
    TUTORIAL: [
      'Step-by-Step Guide to Traditional Vietnamese Embroidery',
      'How to Identify Authentic Handcrafted Products',
      "Beginner's Guide to Bamboo Weaving Techniques",
      'Essential Tools for Traditional Woodworking',
      'Natural Dyeing Techniques Using Local Plants',
      'How to Care for Your Handcrafted Textiles',
      'Traditional Lacquerware Maintenance Tips',
      'Setting Up Your Home Pottery Studio',
      'Sustainable Craft Practices for Beginners',
      'Understanding the Stages of Ceramic Firing',
    ],
    PRODUCT_SHOWCASE: [
      'Introducing Our New Collection of Handwoven Textiles',
      'The Story Behind Our Best-Selling Ceramic Set',
      'Spotlight on Our Award-Winning Lacquerware',
      'Our Latest Sustainable Bamboo Products',
      'Customer Favorites: Our Most Popular Handcrafted Items',
      'Special Limited Edition: Ceremonial Craft Pieces',
      'The Making of Our Signature Hand-carved Furniture',
      'Traditional Materials in Our Contemporary Designs',
      'Exclusive Look at Our Upcoming Seasonal Collection',
      'Heritage Pieces: Our Museum-Quality Craft Items',
    ],
    BEHIND_THE_SCENES: [
      "A Day in My Workshop: The Craftsperson's Routine",
      'The Ancient Tools I Use in My Daily Practice',
      'My Creative Process from Concept to Completion',
      'Sourcing Materials: How I Select the Perfect Raw Ingredients',
      'Inside the Traditional Firing Process',
      'The Collaboration Behind Our Workshop',
      'Seasonal Changes in Our Craft Production',
      'The Apprenticeship System in Our Workshop',
      'The Challenges of Preserving Traditional Techniques',
      'How We Balance Traditional Methods with Modern Needs',
    ],
    EVENT: [
      'Join Us for Our Annual Craft Festival',
      'Upcoming Workshop: Learn Traditional Techniques',
      'Exhibition Opening: A Century of Vietnamese Craft',
      'Meet the Artisan: In-Store Demonstration Schedule',
      'Register Now: Traditional Craft Summer Courses',
      'Special Collaboration Event with Local Artists',
      'Join Our Virtual Tour of Historic Craft Villages',
      'Craft Market: Supporting Artisans in Our Community',
      'Celebrating the Harvest: Seasonal Craft Showcase',
      'Cultural Heritage Day: Traditional Craft Demonstrations',
    ],
  };

  // Create post content based on type
  function createPostContent(type: PostType, specialties: string[] = [], productName: string = '') {
    const contentBlocksByType = {
      STORY: [
        {
          type: 'paragraph',
          content: `My journey into the world of ${specialties.join(' and ')} began many years ago, when I was just a child watching my grandparents work with their hands. In our village, craft wasn't just a profession—it was a way of life, connecting us to our ancestors and to the natural world around us.`,
        },
        {
          type: 'paragraph',
          content: `I remember the first time I was allowed to try the techniques myself. My hands were clumsy and the results far from perfect, but the joy of creation was undeniable. My grandmother would smile patiently and say, "The hands remember what the mind forgets." Years later, I understand the wisdom in her words.`,
        },
        {
          type: 'image',
          url: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/500`,
          caption: 'Early work from my apprenticeship years',
        },
        {
          type: 'paragraph',
          content: `Today, I am proud to continue this tradition while bringing my own vision to the work. Each piece I create carries the echoes of those who came before me, while speaking to the needs and aesthetics of contemporary life. It is this balance—honoring the past while embracing the future—that gives meaning to my daily practice.`,
        },
        {
          type: 'paragraph',
          content: `In sharing my story, I hope to inspire appreciation not just for the objects I create, but for the cultural heritage they represent. In a world of mass production, there is profound value in objects made slowly, with intention and care, by human hands.`,
        },
      ],
      TUTORIAL: [
        {
          type: 'paragraph',
          content: `In this tutorial, I'll guide you through the basic techniques of ${specialties[0] || 'traditional craft'}. While mastery takes years of practice, these fundamentals will help you understand and appreciate the craft, whether you're a beginner or simply curious about the process.`,
        },
        {
          type: 'heading',
          content: `Materials You'll Need`,
        },
        {
          type: 'list',
          items: [
            'High-quality raw materials from sustainable sources',
            'Traditional tools (details below)',
            'Workspace with good lighting and ventilation',
            'Patience and attention to detail',
          ],
        },
        {
          type: 'image',
          url: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/500`,
          caption: 'Essential tools for the beginning craftsperson',
        },
        {
          type: 'heading',
          content: 'Step 1: Preparation',
        },
        {
          type: 'paragraph',
          content: `Before beginning the actual work, proper preparation is essential. This includes selecting materials of appropriate quality, preparing your workspace, and cultivating the right mindset—one of patience and presence.`,
        },
        {
          type: 'heading',
          content: 'Step 2: Basic Technique',
        },
        {
          type: 'paragraph',
          content: `The foundation of all advanced work lies in mastering the basic techniques. Focus on consistency and precision rather than speed, which will come with practice. Remember that even master craftspeople began with these same foundational skills.`,
        },
        {
          type: 'tip',
          content: `Take breaks when needed. Craft requires focus, and quality suffers when we're tired or distracted.`,
        },
      ],
      PRODUCT_SHOWCASE: [
        {
          type: 'paragraph',
          content: `I'm excited to introduce you to ${productName || 'our newest creation'}, a piece that represents the pinnacle of traditional craftsmanship combined with contemporary design sensibilities. Each piece is entirely handmade in our workshop using techniques passed down through generations.`,
        },
        {
          type: 'image',
          url: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/500`,
          caption: 'A closer look at the intricate details',
        },
        {
          type: 'paragraph',
          content: `What makes this piece special is the meticulous attention to detail at every stage of creation. From selecting the finest raw materials to the final finishing touches, no aspect is overlooked. The result is not just a functional object, but a work of art that carries cultural significance and personal meaning.`,
        },
        {
          type: 'features',
          items: [
            'Handcrafted using traditional techniques',
            'Made from sustainably sourced materials',
            'Unique variations in each piece',
            'Designed for both beauty and functionality',
            'Created to last for generations',
          ],
        },
        {
          type: 'paragraph',
          content: `We've designed this piece to integrate seamlessly into contemporary living while honoring its traditional roots. It serves as a reminder of the value of handmade objects in our increasingly digital world—objects with soul, story, and substance.`,
        },
      ],
      BEHIND_THE_SCENES: [
        {
          type: 'paragraph',
          content: `Many people see only the finished product, but behind each piece lies a world of tradition, skill, and dedication. Today, I'm inviting you into my workshop to witness the process behind creating our ${specialties[0] || 'handcrafted items'}.`,
        },
        {
          type: 'image',
          url: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/500`,
          caption: 'Morning light in the workshop',
        },
        {
          type: 'paragraph',
          content: `My day typically begins before sunrise. There's something magical about the early morning hours—the quiet concentration, the quality of light, the connection to craftspeople throughout history who have begun their days in similar ways, with similar tools in hand.`,
        },
        {
          type: 'paragraph',
          content: `One of the most common questions I receive is about how long it takes to create a single piece. The answer varies widely, but what remains constant is that every item receives the time it requires—no rushing, no cutting corners. Some pieces might take days, others weeks or even months for complex items.`,
        },
        {
          type: 'image',
          url: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/500`,
          caption: 'Tools passed down through generations',
        },
        {
          type: 'paragraph',
          content: `Many of the tools I use daily have been passed down through generations of craftspeople. There's a profound connection in working with implements that carry the imprint of countless hands before mine. In a very real sense, each piece I create is a collaboration with the past.`,
        },
      ],
      EVENT: [
        {
          type: 'paragraph',
          content: `We're thrilled to announce our upcoming event celebrating the rich tradition of ${specialties.join(' and ')}. This gathering will bring together craftspeople, enthusiasts, and the curious to share knowledge, showcase exceptional work, and strengthen our community.`,
        },
        {
          type: 'details',
          items: [
            `Date: ${new Date(Date.now() + Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
            'Time: 10:00 AM - 5:00 PM',
            'Location: Cultural Heritage Center, Hanoi',
            'Admission: Free (Registration required)',
          ],
        },
        {
          type: 'image',
          url: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/500`,
          caption: "Highlights from last year's event",
        },
        {
          type: 'heading',
          content: 'Event Highlights',
        },
        {
          type: 'list',
          items: [
            'Live demonstrations of traditional techniques',
            'Exhibition of master craftwork',
            'Hands-on workshops for all skill levels',
            'Panel discussions on preserving craft heritage',
            'Marketplace featuring local artisans',
          ],
        },
        {
          type: 'paragraph',
          content: `Whether you're an experienced practitioner or simply curious about traditional crafts, this event offers something for everyone. It's a rare opportunity to engage directly with the keepers of these cultural traditions and to support the continued vitality of handcraft in our modern world.`,
        },
        {
          type: 'paragraph',
          content: `Registration opens next week. We look forward to welcoming you to this celebration of craft, community, and cultural heritage.`,
        },
      ],
    };

    return contentBlocksByType[type] || contentBlocksByType.STORY;
  }

  const posts = [];
  const productMentions = [];

  // Create 5-10 posts for each artisan
  for (const user of artisanUsers) {
    // Skip if user doesn't have an artisan profile
    if (!user.artisanProfile) continue;

    // Random number of posts between 5-10
    const numPosts = Math.floor(Math.random() * 6) + 5;

    for (let i = 0; i < numPosts; i++) {
      // Select a random post type
      const postType =
        Object.values(PostType)[Math.floor(Math.random() * Object.values(PostType).length)];

      // Select a random title based on type
      const title = postTitles[postType][Math.floor(Math.random() * postTitles[postType].length)];

      // Generate a slug from the title
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');

      // Create content based on type
      const specialties = user.artisanProfile.specialties || [];

      // Find user's products for product showcase posts
      let productForMention = null;
      if (postType === PostType.PRODUCT_SHOWCASE) {
        const userProducts = products.filter((p) => p.sellerId === user.id);
        if (userProducts.length > 0) {
          productForMention = userProducts[Math.floor(Math.random() * userProducts.length)];
        }
      }

      const content = createPostContent(postType, specialties, productForMention?.name);

      // Convert content blocks to JSON string for storage
      const contentJson = JSON.stringify(content);

      // Modify the extract text content function
      const contentText = content
        .map((block) => {
          if (block.type === 'paragraph' || block.type === 'heading') {
            return (block as TextBlock).content;
          } else if (
            block.type === 'list' ||
            block.type === 'features' ||
            block.type === 'details'
          ) {
            return (block as ListBlock).items.join('. ');
          } else if (block.type === 'tip') {
            return `Tip: ${(block as TextBlock).content}`;
          } else if (block.type === 'image') {
            return (block as ImageBlock).caption || '';
          }
          return '';
        })
        .join('\n\n');

      // Generate media URLs - filter out any undefined values
      const mediaUrls = content
        .filter((block) => block.type === 'image')
        .map((block) => (block as ImageBlock).url)
        .filter((url) => url !== undefined);

      // Random tags with proper typing
      const allTags = [
        'traditional craft',
        'handmade',
        'artisan',
        'vietnamese heritage',
        'sustainable',
        'tutorials',
        'behind the scenes',
        'craft process',
        'exhibition',
        'workshop',
        'craft community',
        'cultural preservation',
      ];
      const numTags = Math.floor(Math.random() * 5) + 1;
      const tags: string[] = [];

      for (let j = 0; j < numTags; j++) {
        const tag = allTags[Math.floor(Math.random() * allTags.length)];
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      }

      // Safe access to first content block for summary
      const summary =
        content.length > 0 && content[0].type === 'paragraph'
          ? `${(content[0] as TextBlock).content.substring(0, 150)}...`
          : `${title} - a post about ${postType}`;

      // Post status - 80% published, 20% draft
      const status = Math.random() < 0.8 ? PostStatus.PUBLISHED : PostStatus.DRAFT;

      // Stats for published posts
      const viewCount = status === PostStatus.PUBLISHED ? Math.floor(Math.random() * 2000) : 0;
      const likeCount = status === PostStatus.PUBLISHED ? Math.floor(Math.random() * 100) : 0;
      const commentCount = status === PostStatus.PUBLISHED ? Math.floor(Math.random() * 30) : 0;
      const shareCount = status === PostStatus.PUBLISHED ? Math.floor(Math.random() * 20) : 0;

      // Create the post
      const postId = uuidv4();
      const uniqueSlug = `${slug}-${postId.substring(0, 8)}`;

      // Fix templateData issue with Prisma.JsonNull
      const templateData =
        Math.random() < 0.3
          ? {
              layout: ['standard', 'featured', 'wide', 'sidebar'][Math.floor(Math.random() * 4)],
              colors: {
                background: ['#ffffff', '#f8f9fa', '#f5f5f5'][Math.floor(Math.random() * 3)],
                text: ['#212529', '#343a40', '#495057'][Math.floor(Math.random() * 3)],
              },
              showAuthor: Math.random() < 0.8,
            }
          : Prisma.JsonNull;

      const post = {
        id: postId,
        userId: user.id,
        title,
        slug: uniqueSlug,
        summary,
        content: JSON.stringify(content), // Store JSON string
        contentText,
        type: postType,
        status,
        thumbnailUrl:
          mediaUrls.length > 0
            ? mediaUrls[0]
            : `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/400/300`,
        coverImage: Math.random() < 0.5 && mediaUrls.length > 0 ? mediaUrls[0] : null,
        mediaUrls, // Now filtered to only contain strings
        tags,
        templateId:
          Math.random() < 0.4 ? `blog-template-${Math.floor(Math.random() * 5) + 1}` : null,
        templateData,
        viewCount,
        likeCount,
        commentCount,
        shareCount,
        publishedAt:
          status === PostStatus.PUBLISHED
            ? new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000)
            : null,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000),
      };

      await prisma.post.create({
        data: post,
      });

      posts.push(post);

      // Create product mention if this is a product showcase and we have a product
      if (postType === PostType.PRODUCT_SHOWCASE && productForMention) {
        const productMention = {
          id: uuidv4(),
          postId,
          productId: productForMention.id,
          contextText: `Featured product: ${productForMention.name}`,
          position: 1,
        };

        await prisma.productMention.create({
          data: productMention,
        });

        productMentions.push(productMention);
      }
    }
  }

  console.log(`Seeded ${posts.length} posts with ${productMentions.length} product mentions`);

  return { posts, productMentions };
}

export { seedPosts };
