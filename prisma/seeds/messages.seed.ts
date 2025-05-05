import { PrismaClient, UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedMessages() {
  console.log('Seeding messages...');

  // Get users for messaging
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      role: true,
      firstName: true,
      lastName: true,
    },
  });

  // Create conversation pairs
  const customers = users.filter((u) => u.role === 'CUSTOMER');
  const artisans = users.filter((u) => u.role === 'ARTISAN');

  // We'll create conversations between:
  // 1. Customers and artisans (most common)
  // 2. Customers and customers (less common)
  // 3. Artisans and artisans (least common)

  const conversationPairs: {
    pair: [(typeof users)[0], (typeof users)[0]];
    type: 'customer-artisan' | 'customer-customer' | 'artisan-artisan';
  }[] = [];

  // 1. Create customer-artisan conversation pairs (most customers message multiple artisans)
  for (const customer of customers) {
    // Random number of artisans to message (1-3)
    const numArtisans = Math.floor(Math.random() * 3) + 1;

    // Randomly select artisans to message
    const artisansToMessage = artisans
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(numArtisans, artisans.length));

    for (const artisan of artisansToMessage) {
      conversationPairs.push({
        pair: [customer, artisan],
        type: 'customer-artisan',
      });
    }
  }

  // 2. Create some customer-customer conversations (less common)
  for (let i = 0; i < Math.min(Math.floor(customers.length / 3), 5); i++) {
    // Select two different customers
    const randomCustomers = customers.sort(() => 0.5 - Math.random()).slice(0, 2);

    if (randomCustomers.length === 2 && randomCustomers[0].id !== randomCustomers[1].id) {
      conversationPairs.push({
        pair: [randomCustomers[0], randomCustomers[1]],
        type: 'customer-customer',
      });
    }
  }

  // 3. Create some artisan-artisan conversations (least common)
  for (let i = 0; i < Math.min(Math.floor(artisans.length / 3), 3); i++) {
    // Select two different artisans
    const randomArtisans = artisans.sort(() => 0.5 - Math.random()).slice(0, 2);

    if (randomArtisans.length === 2 && randomArtisans[0].id !== randomArtisans[1].id) {
      conversationPairs.push({
        pair: [randomArtisans[0], randomArtisans[1]],
        type: 'artisan-artisan',
      });
    }
  }

  // Message templates by conversation type
  const messageTemplates = {
    'customer-artisan': [
      {
        sender: 'customer',
        messages: [
          "Hello, I'm interested in your {artisan} work. Do you offer custom orders?",
          "Hi there! I saw your {artisan} pieces and I'm wondering about shipping to my location.",
          'I love the {artisan} pieces in your shop. Could you tell me more about your process?',
          "Do you have any {artisan} items that aren't listed in your shop?",
          'I recently purchased one of your {artisan} pieces and had a question about care instructions.',
          "Hi! I'm looking for a {artisan} piece as a gift. What would you recommend?",
        ],
      },
      {
        sender: 'artisan',
        messages: [
          'Thank you for your interest in my work! Yes, I do offer custom orders. Could you tell me what you have in mind?',
          "Hello! I'm happy to ship internationally. What country are you located in so I can provide shipping costs?",
          "Thank you for your kind words! I'd be happy to tell you more about my process. Each piece is handcrafted using traditional techniques passed down through generations.",
          "I do have some special pieces that aren't listed. What type of item were you looking for?",
          "I'm glad you like your purchase! For care, I recommend gentle cleaning with a soft cloth and keeping it away from direct sunlight.",
          "Thanks for your message! I'd be happy to help you find the perfect gift. Could you tell me a bit about the recipient?",
        ],
      },
    ],
    'customer-customer': [
      {
        sender: 'either',
        messages: [
          'Hi! I saw your review of {artisan} products. Have you purchased from other artisans on the platform?',
          'Hello! I noticed we both collect {artisan} pieces. Have you seen the new collection from that maker in Hue?',
          "I'm new to the platform and noticed you've been active in the community. Any artisans you'd recommend?",
          "Hi there! We both commented on that {artisan} showcase post. I'm looking for similar items - any recommendations?",
        ],
      },
    ],
    'artisan-artisan': [
      {
        sender: 'either',
        messages: [
          'Hello fellow artisan! I admire your work in {artisan}. Would you be interested in a collaborative project?',
          'Hi there! I noticed we both work with {artisan}. Where do you source your materials?',
          "I'm heading to the craft market in Hanoi next month. Will you be showcasing your {artisan} work there?",
          'Your {artisan} techniques are amazing. Would you be open to sharing some tips or possibly a skill exchange?',
        ],
      },
    ],
  };

  // Response templates (for second message)
  const responseTemplates: {
    'customer-artisan': {
      customer: string[];
      artisan: string[];
    };
    'customer-customer': string[];
    'artisan-artisan': string[];
  } = {
    'customer-artisan': {
      customer: [
        "That sounds perfect! I'm looking for something with a more personal touch.",
        "I'm in the United States. Would that be a problem for shipping?",
        "That's fascinating! How long does it typically take you to complete a piece?",
        "I'm particularly interested in smaller items that would work as housewarming gifts.",
        "Thank you for the care instructions. I'll make sure to follow them.",
        "It's for my mother's birthday. She loves traditional Vietnamese crafts with blue tones.",
      ],
      artisan: [
        "Great! I'd be happy to work with you on a custom piece. What size and color are you thinking?",
        'No problem at all! I ship to the US regularly. Shipping usually takes 2-3 weeks.',
        'Each piece is unique, but typically a larger item takes 2-3 weeks to complete.',
        'I have several smaller items that would make perfect housewarming gifts. Would you prefer something decorative or functional?',
        "You're welcome! If you have any other questions about your purchase, please don't hesitate to ask.",
        'I think I have the perfect piece for your mother. Would you like me to send you some photos of items with blue designs?',
      ],
    },
    'customer-customer': [
      "Yes, I've bought from several artisans here. My favorites are the ceramic studios in Bat Trang village.",
      "I haven't seen it yet! Thanks for the tip, I'll definitely check it out.",
      "Welcome to the platform! I'd highly recommend checking out the woodworkers from Hue and the textile artisans from Sapa.",
      'You might want to look at the shops specializing in natural dyed textiles. There are some amazing pieces!',
    ],
    'artisan-artisan': [
      "I'd love to collaborate! I've been thinking about combining our techniques for a special collection.",
      'I work with a cooperative in northern Vietnam. They provide sustainable materials with fair trade practices.',
      "Yes, I'll be there! Would be great to meet in person and discuss our craft.",
      "I'd be happy to exchange techniques. Perhaps we could arrange a virtual workshop sometime?",
    ],
  };

  // Follow-up templates (for third message)
  const followUpTemplates = {
    'customer-artisan': {
      customer: [
        "That would be wonderful. I'm thinking of something about 30cm in size with earth tones.",
        'Perfect! Could you give me an estimate of the shipping cost?',
        "Wow, that's quite a process. Do you create each piece individually or work in small batches?",
        "I'm leaning toward something functional but beautiful. Maybe a small box or container?",
        'Actually, I did have one more question. Is it safe to use oils on the wood to maintain it?',
        "Yes, I'd love to see some options! Her birthday is next month, so I have some time to decide.",
      ],
      artisan: [
        'Earth tones work beautifully with my techniques. I can draft a design for you this week. Would you like to see sketches before I begin?',
        'For a standard-sized package to the US, shipping would be around $25-30. I offer tracking with all international orders.',
        "Each piece is made individually. I don't mass-produce anything - that's what makes each creation unique.",
        'I have some lovely lacquered boxes that combine beauty and function. Would you prefer geometric or floral designs?',
        'For our wooden pieces, I recommend a light beeswax polish rather than oil. It protects the wood without darkening it too much.',
        "Perfect! I'll send some photos tomorrow of pieces with blue patterns that I think your mother might like.",
      ],
    },
  };

  const messages = [];

  // Create messages for each conversation pair
  for (const conversation of conversationPairs) {
    const [user1, user2] = conversation.pair;
    const type = conversation.type;

    // Random number of messages in this conversation (2-5)
    const numMessages = Math.floor(Math.random() * 4) + 2;

    // Starting timestamp (between 1-60 days ago)
    let timestamp = new Date(Date.now() - Math.floor(Math.random() * 60 + 1) * 24 * 60 * 60 * 1000);

    // First message
    let firstSender;
    let firstRecipient;
    let firstMessageContent = '';

    if (type === 'customer-artisan') {
      // Customer always initiates in customer-artisan conversations
      firstSender = user1.role === 'CUSTOMER' ? user1 : user2;
      firstRecipient = user1.role === 'ARTISAN' ? user1 : user2;

      // Get random first message template
      const template = messageTemplates[type][0];
      firstMessageContent = template.messages[Math.floor(Math.random() * template.messages.length)];

      // Replace {artisan} placeholder with artisan specialization (or default)
      firstMessageContent = firstMessageContent.replace(
        '{artisan}',
        ['ceramic', 'wooden', 'textile', 'bamboo', 'lacquer'][Math.floor(Math.random() * 5)],
      );
    } else if (type === 'customer-customer' || type === 'artisan-artisan') {
      // Random initiator for other conversation types
      if (Math.random() < 0.5) {
        firstSender = user1;
        firstRecipient = user2;
      } else {
        firstSender = user2;
        firstRecipient = user1;
      }

      // Get random first message template
      const template = messageTemplates[type][0];
      firstMessageContent = template.messages[Math.floor(Math.random() * template.messages.length)];

      // Replace {artisan} placeholder
      firstMessageContent = firstMessageContent.replace(
        '{artisan}',
        ['ceramic', 'wooden', 'textile', 'bamboo', 'lacquer'][Math.floor(Math.random() * 5)],
      );
    }

    // Make sure firstSender and firstRecipient are defined
    if (!firstSender || !firstRecipient) {
      continue;
    }

    // Create first message
    const firstMessage = {
      id: uuidv4(),
      senderId: firstSender.id,
      recipientId: firstRecipient.id,
      content: firstMessageContent,
      attachments: [],
      isRead: true, // First message is always read
      readAt: new Date(timestamp.getTime() + 1000 * 60 * 30), // Read 30 minutes after being sent
      createdAt: timestamp,
    };

    await prisma.message.create({
      data: firstMessage,
    });

    messages.push(firstMessage);

    // Second message (response)
    if (numMessages >= 2) {
      // Advance timestamp by 1-24 hours
      timestamp = new Date(
        timestamp.getTime() + 1000 * 60 * 60 * (Math.floor(Math.random() * 24) + 1),
      );

      let responseContent = '';

      if (type === 'customer-artisan') {
        // Get appropriate response based on roles
        const responderRole = firstSender.role === 'CUSTOMER' ? 'artisan' : 'customer';
        const templateResponses = responseTemplates['customer-artisan'][responderRole];
        const templateIndex = Math.floor(Math.random() * templateResponses.length);
        responseContent = templateResponses[templateIndex];
      } else if (type === 'customer-customer') {
        // For customer-customer conversations
        responseContent =
          responseTemplates['customer-customer'][
            Math.floor(Math.random() * responseTemplates['customer-customer'].length)
          ];
      } else if (type === 'artisan-artisan') {
        // For artisan-artisan conversations
        responseContent =
          responseTemplates['artisan-artisan'][
            Math.floor(Math.random() * responseTemplates['artisan-artisan'].length)
          ];
      }

      const secondMessage = {
        id: uuidv4(),
        senderId: firstRecipient.id,
        recipientId: firstSender.id,
        content: responseContent,
        attachments: [],
        isRead: true,
        readAt: new Date(timestamp.getTime() + 1000 * 60 * 15), // Read 15 minutes after being sent
        createdAt: timestamp,
      };

      await prisma.message.create({
        data: secondMessage,
      });

      messages.push(secondMessage);
    }

    // Third message (follow up)
    if (numMessages >= 3 && type === 'customer-artisan') {
      // Advance timestamp by 1-12 hours
      timestamp = new Date(
        timestamp.getTime() + 1000 * 60 * 60 * (Math.floor(Math.random() * 12) + 1),
      );

      // Get appropriate follow-up based on roles
      const followUpSenderRole = firstSender.role === 'CUSTOMER' ? 'customer' : 'artisan';
      const templateIndex = Math.floor(
        Math.random() * followUpTemplates[type][followUpSenderRole].length,
      );
      const followUpContent = followUpTemplates[type][followUpSenderRole][templateIndex];

      const thirdMessage = {
        id: uuidv4(),
        senderId: firstSender.id,
        recipientId: firstRecipient.id,
        content: followUpContent,
        attachments: [],
        isRead: true,
        readAt: new Date(timestamp.getTime() + 1000 * 60 * 20), // Read 20 minutes after being sent
        createdAt: timestamp,
      };

      await prisma.message.create({
        data: thirdMessage,
      });

      messages.push(thirdMessage);
    }

    // Fourth message (second response)
    if (numMessages >= 4 && type === 'customer-artisan') {
      // Advance timestamp by 2-24 hours
      timestamp = new Date(
        timestamp.getTime() + 1000 * 60 * 60 * (Math.floor(Math.random() * 22) + 2),
      );

      // Get appropriate response based on roles
      const responderRole = firstSender.role === 'CUSTOMER' ? 'artisan' : 'customer';
      const templateIndex = Math.floor(
        Math.random() * followUpTemplates[type][responderRole].length,
      );
      const responseContent = followUpTemplates[type][responderRole][templateIndex];

      const fourthMessage = {
        id: uuidv4(),
        senderId: firstRecipient.id,
        recipientId: firstSender.id,
        content: responseContent,
        attachments: [],
        isRead: Math.random() < 0.7, // 70% chance of being read
        readAt: Math.random() < 0.7 ? new Date(timestamp.getTime() + 1000 * 60 * 10) : null, // Read 10 minutes after if read
        createdAt: timestamp,
      };

      await prisma.message.create({
        data: fourthMessage,
      });

      messages.push(fourthMessage);
    }

    // Fifth message (latest conversation)
    if (numMessages >= 5 && type === 'customer-artisan') {
      // Advance timestamp by 1-12 hours
      timestamp = new Date(
        timestamp.getTime() + 1000 * 60 * 60 * (Math.floor(Math.random() * 12) + 1),
      );

      // Custom message content for latest exchange
      let finalMessageContent = '';

      if (firstSender.role === 'CUSTOMER') {
        finalMessageContent = [
          "Yes, I'd love to see sketches before you begin. Looking forward to it!",
          'The shipping cost sounds reasonable. When could you ship it if I order this week?',
          "That's what I love about handcrafted pieces. Each one has its own character.",
          'I think floral designs would be perfect. Do you have any examples you could show me?',
          "Thank you for the recommendation. I'll get some beeswax polish.",
          "I'm excited to see the options! Thank you for your help with finding the perfect gift.",
        ][Math.floor(Math.random() * 6)];
      } else {
        finalMessageContent = [
          "Perfect! I'll prepare some sketches this week and send them to you for approval.",
          'If you order this week, I can ship it by next Tuesday. Production time is about 5-7 days.',
          "Exactly! That's why I love creating unique pieces for my customers.",
          "I'll send you some photos of my floral designs tomorrow. I think you'll find something you love.",
          "You're welcome! Let me know if you need any more care advice for your purchase.",
          "I'm happy to help! I'll gather some options that I think would make wonderful gifts.",
        ][Math.floor(Math.random() * 6)];
      }

      const fifthMessage = {
        id: uuidv4(),
        senderId: firstSender.id,
        recipientId: firstRecipient.id,
        content: finalMessageContent,
        attachments: [],
        isRead: Math.random() < 0.5, // 50% chance of being read
        readAt: Math.random() < 0.5 ? new Date(timestamp.getTime() + 1000 * 60 * 5) : null, // Read 5 minutes after if read
        createdAt: timestamp,
      };

      await prisma.message.create({
        data: fifthMessage,
      });

      messages.push(fifthMessage);
    }
  }

  console.log(`Seeded ${messages.length} messages`);

  return messages;
}

export { seedMessages };
