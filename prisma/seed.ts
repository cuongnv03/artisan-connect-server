import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Types để đảm bảo type safety
interface UserData {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'ARTISAN' | 'CUSTOMER';
  bio?: string;
  isVerified?: boolean;
  password: string;
  emailVerified: boolean;
  followerCount: number;
  followingCount: number;
}

interface ArtisanData {
  shopName: string;
  shopDescription: string;
  specialties: string[];
  experience: number;
  contactEmail: string;
  contactPhone: string;
}

interface ProductData {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  tags: string[];
  isCustomizable: boolean;
  category: string;
}

interface PostData {
  title: string;
  summary: string;
  content: {
    blocks: Array<{
      type: string;
      content?: string;
      url?: string;
      caption?: string;
    }>;
  };
  type: 'BEHIND_THE_SCENES' | 'TUTORIAL' | 'PRODUCT_SHOWCASE' | 'STORY' | 'EVENT' | 'GENERAL';
  tags: string[];
}

async function main() {
  console.log('🌱 Bắt đầu seed database...');

  // Xóa dữ liệu cũ theo thứ tự phụ thuộc
  await cleanDatabase();

  // Tạo Categories trước
  const categories = await createCategories();

  // Tạo Users
  const users = await createUsers();

  // Tạo Profiles và Addresses
  await createProfilesAndAddresses(users);

  // Tạo ArtisanProfiles và UpgradeRequests
  await createArtisanProfiles(users);
  await createUpgradeRequests(users);

  // Tạo Products
  const products = await createProducts(users, categories);

  // Tạo Posts
  const posts = await createPosts(users);

  // Tạo Social interactions
  await createFollows(users);
  await createLikesAndSavedPosts(users, posts);
  await createComments(users, posts);

  // Tạo Reviews
  await createReviews(users, products);

  // Tạo Cart và Orders
  await createCartItems(users, products);
  await createOrders(users, products);

  // Tạo Quotes
  await createQuoteRequests(users, products);

  // Tạo Messages và Notifications
  await createMessages(users);
  await createNotifications(users);

  console.log('✅ Seed database thành công!');
}

async function cleanDatabase() {
  // Xóa theo thứ tự ngược lại để tránh lỗi foreign key
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.quoteNegotiation.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productMention.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.categoryProduct.deleteMany();
  await prisma.category.deleteMany();
  await prisma.product.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postAnalytics.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.artisanUpgradeRequest.deleteMany();
  await prisma.artisanProfile.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userActivity.deleteMany();
  await prisma.address.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
}

async function createCategories() {
  const categories = [
    {
      name: 'Gốm sứ',
      slug: 'gom-su',
      description: 'Sản phẩm gốm sứ thủ công truyền thống',
      level: 0,
      children: [
        { name: 'Bát đĩa', slug: 'bat-dia', description: 'Bát đĩa gốm sứ cao cấp' },
        { name: 'Bình hoa', slug: 'binh-hoa', description: 'Bình hoa gốm sứ trang trí' },
        { name: 'Ấm trà', slug: 'am-tra', description: 'Bộ ấm trà gốm sứ Bát Tràng' },
      ],
    },
    {
      name: 'Thêu thùa',
      slug: 'theu-thua',
      description: 'Sản phẩm thêu tay truyền thống',
      level: 0,
      children: [
        { name: 'Tranh thêu', slug: 'tranh-theu', description: 'Tranh thêu tay cao cấp' },
        { name: 'Khăn thêu', slug: 'khan-theu', description: 'Khăn thêu tay tinh xảo' },
        { name: 'Áo dài thêu', slug: 'ao-dai-theu', description: 'Áo dài thêu tay độc đáo' },
      ],
    },
    {
      name: 'Đồ gỗ',
      slug: 'do-go',
      description: 'Sản phẩm gỗ thủ công mỹ nghệ',
      level: 0,
      children: [
        { name: 'Tượng gỗ', slug: 'tuong-go', description: 'Tượng gỗ điêu khắc tinh xảo' },
        { name: 'Đồ nội thất', slug: 'do-noi-that', description: 'Nội thất gỗ cao cấp' },
        { name: 'Đồ lưu niệm', slug: 'do-luu-niem', description: 'Đồ lưu niệm gỗ nhỏ' },
      ],
    },
    {
      name: 'Tranh vẽ',
      slug: 'tranh-ve',
      description: 'Tranh vẽ tay nghệ thuật',
      level: 0,
      children: [
        { name: 'Tranh sơn dầu', slug: 'tranh-son-dau', description: 'Tranh sơn dầu cao cấp' },
        { name: 'Tranh lụa', slug: 'tranh-lua', description: 'Tranh vẽ trên lụa' },
        { name: 'Tranh Đông Hồ', slug: 'tranh-dong-ho', description: 'Tranh dân gian Đông Hồ' },
      ],
    },
    {
      name: 'Đồ da',
      slug: 'do-da',
      description: 'Sản phẩm da thủ công',
      level: 0,
      children: [
        { name: 'Ví da', slug: 'vi-da', description: 'Ví da thủ công cao cấp' },
        { name: 'Túi xách', slug: 'tui-xach', description: 'Túi xách da thủ công' },
        { name: 'Giày dép', slug: 'giay-dep', description: 'Giày dép da thủ công' },
      ],
    },
  ];

  const createdCategories = [];

  for (const category of categories) {
    const parent = await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        level: category.level,
        sortOrder: categories.indexOf(category),
      },
    });

    createdCategories.push(parent);

    if (category.children) {
      for (const child of category.children) {
        const childCategory = await prisma.category.create({
          data: {
            name: child.name,
            slug: child.slug,
            description: child.description,
            parentId: parent.id,
            level: 1,
            sortOrder: category.children.indexOf(child),
          },
        });
        createdCategories.push(childCategory);
      }
    }
  }

  return createdCategories;
}

async function createUsers(): Promise<UserData[]> {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const userData = [
    // Admin
    {
      email: 'admin@artisan.vn',
      username: 'admin',
      firstName: 'Nguyễn',
      lastName: 'Admin',
      role: 'ADMIN' as const,
      bio: 'Quản trị viên hệ thống Artisan Connect',
    },
    // Artisans
    {
      email: 'nguyenthimai@artisan.vn',
      username: 'mai_gom_batrang',
      firstName: 'Nguyễn Thị',
      lastName: 'Mai',
      role: 'ARTISAN' as const,
      bio: 'Nghệ nhân gốm sứ Bát Tràng với 20 năm kinh nghiệm',
      isVerified: true,
    },
    {
      email: 'tranvanminh@artisan.vn',
      username: 'minh_go_cao_cap',
      firstName: 'Trần Văn',
      lastName: 'Minh',
      role: 'ARTISAN' as const,
      bio: 'Thợ mộc chuyên đồ gỗ nội thất cao cấp từ gỗ quý',
      isVerified: true,
    },
    {
      email: 'phamthilan@artisan.vn',
      username: 'lan_theu_tay',
      firstName: 'Phạm Thị',
      lastName: 'Lan',
      role: 'ARTISAN' as const,
      bio: 'Nghệ nhân thêu tay truyền thống làng Quất Động',
      isVerified: true,
    },
    {
      email: 'levanhoang@artisan.vn',
      username: 'hoang_tranh_son_mai',
      firstName: 'Lê Văn',
      lastName: 'Hoàng',
      role: 'ARTISAN' as const,
      bio: 'Họa sĩ chuyên tranh sơn mài và tranh lụa',
    },
    {
      email: 'ngothihong@artisan.vn',
      username: 'hong_da_that',
      firstName: 'Ngô Thị',
      lastName: 'Hồng',
      role: 'ARTISAN' as const,
      bio: 'Thợ da thủ công với 15 năm kinh nghiệm',
    },
    // Customers
    {
      email: 'dinhvannam@gmail.com',
      username: 'nam_collector',
      firstName: 'Đinh Văn',
      lastName: 'Nam',
      role: 'CUSTOMER' as const,
      bio: 'Người yêu thích và sưu tầm đồ thủ công mỹ nghệ',
    },
    {
      email: 'vuthihuong@gmail.com',
      username: 'huong_decor',
      firstName: 'Vũ Thị',
      lastName: 'Hương',
      role: 'CUSTOMER' as const,
      bio: 'Chuyên gia trang trí nội thất, đam mê đồ handmade',
    },
    {
      email: 'nguyenquanghuy@gmail.com',
      username: 'huy_artlover',
      firstName: 'Nguyễn Quang',
      lastName: 'Huy',
      role: 'CUSTOMER' as const,
      bio: 'Kinh doanh quà tặng cao cấp',
    },
    {
      email: 'tranthithuy@gmail.com',
      username: 'thuy_fashion',
      firstName: 'Trần Thị',
      lastName: 'Thủy',
      role: 'CUSTOMER' as const,
      bio: 'Yêu thích thời trang và phụ kiện thủ công',
    },
    {
      email: 'hoangvanduc@gmail.com',
      username: 'duc_antique',
      firstName: 'Hoàng Văn',
      lastName: 'Đức',
      role: 'CUSTOMER' as const,
      bio: 'Sưu tầm đồ cổ và đồ thủ công truyền thống',
    },
    {
      email: 'phamvankhoa@gmail.com',
      username: 'khoa_designer',
      firstName: 'Phạm Văn',
      lastName: 'Khoa',
      role: 'CUSTOMER' as const,
      bio: 'Designer nội thất, tìm kiếm sản phẩm độc đáo',
    },
    {
      email: 'nguyenthihanh@gmail.com',
      username: 'hanh_gift',
      firstName: 'Nguyễn Thị',
      lastName: 'Hạnh',
      role: 'CUSTOMER' as const,
      bio: 'Chủ shop quà tặng handmade',
    },
  ];

  const users: UserData[] = [];
  for (const data of userData) {
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        emailVerified: true,
        followerCount: Math.floor(Math.random() * 1000),
        followingCount: Math.floor(Math.random() * 500),
      },
    });
    users.push(user as UserData);
  }

  return users;
}

async function createProfilesAndAddresses(users: UserData[]) {
  for (const user of users) {
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        coverUrl: `https://picsum.photos/seed/${user.id}/1200/400`,
        location: getRandomLocation(),
        website: user.role === 'ARTISAN' ? `https://${user.username}.artisan.vn` : null,
        dateOfBirth: new Date(
          1970 + Math.floor(Math.random() * 30),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28),
        ),
        gender: Math.random() > 0.5 ? 'Nam' : 'Nữ',
        socialLinks: {
          facebook: `https://facebook.com/${user.username}`,
          instagram: `https://instagram.com/${user.username}`,
        },
      },
    });

    // Tạo 1-3 địa chỉ cho mỗi user
    const addressCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < addressCount; i++) {
      const addressData = generateAddress();
      await prisma.address.create({
        data: {
          profileId: profile.id,
          fullName: `${user.firstName} ${user.lastName}`,
          phone: generatePhoneNumber(),
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode,
          country: addressData.country,
          isDefault: i === 0,
        },
      });
    }
  }
}

async function createArtisanProfiles(users: UserData[]) {
  const artisans = users.filter((u) => u.role === 'ARTISAN');
  const profiles = [];

  const artisanData: ArtisanData[] = [
    {
      shopName: 'Gốm sứ Mai Bát Tràng',
      shopDescription:
        'Cửa hàng gốm sứ gia truyền 3 đời tại làng gốm Bát Tràng. Chuyên sản xuất gốm sứ cao cấp theo phương pháp truyền thống kết hợp hiện đại.',
      specialties: ['Gốm sứ', 'Bát đĩa', 'Bình hoa'],
      experience: 20,
      contactEmail: 'gommai@batrang.vn',
      contactPhone: '0912345678',
    },
    {
      shopName: 'Nội thất gỗ Minh Phúc',
      shopDescription:
        'Xưởng mộc chuyên sản xuất đồ gỗ nội thất cao cấp từ gỗ quý như gỗ hương, gỗ gụ. Nhận đặt hàng theo yêu cầu.',
      specialties: ['Đồ gỗ', 'Nội thất', 'Điêu khắc'],
      experience: 25,
      contactEmail: 'noithatminhphuc@gmail.com',
      contactPhone: '0923456789',
    },
    {
      shopName: 'Thêu tay Lan Huế',
      shopDescription:
        'Cửa hàng thêu tay truyền thống, chuyên các sản phẩm thêu tay cao cấp như tranh thêu, áo dài thêu, khăn thêu.',
      specialties: ['Thêu thùa', 'Tranh thêu', 'Áo dài'],
      experience: 15,
      contactEmail: 'theulanhue@gmail.com',
      contactPhone: '0934567890',
    },
    {
      shopName: 'Tranh sơn mài Hoàng Gia',
      shopDescription:
        'Họa sĩ chuyên vẽ tranh sơn mài, tranh lụa theo phong cách truyền thống và hiện đại.',
      specialties: ['Tranh vẽ', 'Sơn mài', 'Tranh lụa'],
      experience: 18,
      contactEmail: 'tranhhoanggia@artisan.vn',
      contactPhone: '0945678901',
    },
    {
      shopName: 'Da thủ công Hồng Hà',
      shopDescription:
        'Xưởng da thủ công chuyên sản xuất ví da, túi xách da, giày dép da cao cấp từ da thật 100%.',
      specialties: ['Đồ da', 'Ví da', 'Túi xách'],
      experience: 15,
      contactEmail: 'dahongha@gmail.com',
      contactPhone: '0956789012',
    },
  ];

  // Đảm bảo không vượt quá bounds
  const maxItems = Math.min(artisans.length, artisanData.length);

  for (let i = 0; i < maxItems; i++) {
    const artisan = artisans[i]!;
    const artisanInfo = artisanData[i]!;

    const profile = await prisma.artisanProfile.create({
      data: {
        userId: artisan.id,
        shopName: artisanInfo.shopName,
        shopDescription: artisanInfo.shopDescription,
        specialties: artisanInfo.specialties,
        experience: artisanInfo.experience,
        website: `https://${artisanInfo.shopName.replace(/\s+/g, '')}.com`,
        contactEmail: artisanInfo.contactEmail,
        contactPhone: artisanInfo.contactPhone,
        shopLogoUrl: `https://picsum.photos/seed/${artisan.id}-logo/200/200`,
        shopBannerUrl: `https://picsum.photos/seed/${artisan.id}-banner/1200/400`,
        isVerified: artisan.isVerified || false,
        rating: 4 + Math.random(),
        reviewCount: Math.floor(Math.random() * 200) + 50,
        totalSales: Math.floor(Math.random() * 50000000) + 10000000,
        socialMedia: {
          facebook: `https://facebook.com/${artisanInfo.shopName.replace(/\s+/g, '')}`,
          instagram: `https://instagram.com/${artisanInfo.shopName.replace(/\s+/g, '')}`,
          youtube:
            Math.random() > 0.5
              ? `https://youtube.com/@${artisanInfo.shopName.replace(/\s+/g, '')}`
              : null,
        },
      },
    });
    profiles.push(profile);
  }

  return profiles;
}

async function createUpgradeRequests(users: UserData[]) {
  const customers = users.filter((u) => u.role === 'CUSTOMER').slice(0, 3);

  const requestData = [
    {
      shopName: 'Mỹ nghệ tre trúc Việt',
      shopDescription: 'Chuyên sản xuất đồ thủ công từ tre trúc như giỏ, rổ, đèn trang trí.',
      specialties: ['Tre trúc', 'Đan lát', 'Trang trí'],
      experience: 10,
      reason: 'Tôi muốn mở rộng kinh doanh và chia sẻ nghệ thuật đan tre trúc truyền thống',
      status: 'PENDING' as const,
      adminNotes: null,
      reviewedAt: null,
    },
    {
      shopName: 'Tơ lụa Bảo Lộc',
      shopDescription: 'Sản xuất và kinh doanh các sản phẩm từ tơ lụa Bảo Lộc chính gốc.',
      specialties: ['Tơ lụa', 'Khăn lụa', 'Áo dài'],
      experience: 8,
      reason: 'Mong muốn quảng bá sản phẩm tơ lụa Bảo Lộc ra thị trường rộng hơn',
      status: 'APPROVED' as const,
      adminNotes: 'Đã xác minh thông tin, chấp thuận nâng cấp',
      reviewedAt: new Date('2024-01-15'),
    },
    {
      shopName: 'Đồng hồ cổ Sài Gòn',
      shopDescription: 'Sưu tầm và phục chế đồng hồ cổ',
      specialties: ['Đồng hồ cổ', 'Phục chế', 'Sưu tầm'],
      experience: 5,
      reason: 'Kinh nghiệm chưa đủ 7 năm theo yêu cầu',
      status: 'REJECTED' as const,
      adminNotes: 'Cần thêm kinh nghiệm, có thể nộp lại sau',
      reviewedAt: new Date('2024-01-10'),
    },
  ];

  const maxItems = Math.min(requestData.length, customers.length);

  for (let i = 0; i < maxItems; i++) {
    const customer = customers[i]!;
    const request = requestData[i]!;

    await prisma.artisanUpgradeRequest.create({
      data: {
        userId: customer.id,
        shopName: request.shopName,
        shopDescription: request.shopDescription,
        specialties: request.specialties,
        experience: request.experience,
        reason: request.reason,
        status: request.status,
        adminNotes: request.adminNotes,
        reviewedAt: request.reviewedAt,
        website: Math.random() > 0.5 ? `https://${request.shopName.replace(/\s+/g, '')}.com` : null,
        socialMedia: {
          facebook: `https://facebook.com/${request.shopName.replace(/\s+/g, '')}`,
        },
      },
    });
  }
}

async function createProducts(users: UserData[], categories: any[]) {
  const artisans = users.filter((u) => u.role === 'ARTISAN');
  const products = [];

  const productData: ProductData[] = [
    // Gốm sứ
    {
      name: 'Bộ ấm trà men rạn cổ',
      description: 'Bộ ấm trà gồm 1 ấm và 6 chén, men rạn cổ độc đáo, phong cách cung đình Huế.',
      price: 2500000,
      discountPrice: 2200000,
      quantity: 15,
      tags: ['gốm sứ', 'ấm trà', 'bát tràng', 'men rạn'],
      isCustomizable: true,
      category: 'Ấm trà',
    },
    {
      name: 'Bình hoa sen xanh ngọc',
      description:
        'Bình hoa gốm sứ cao 30cm, họa tiết hoa sen tinh xảo, men xanh ngọc truyền thống.',
      price: 1800000,
      quantity: 20,
      tags: ['gốm sứ', 'bình hoa', 'trang trí', 'sen'],
      isCustomizable: false,
      category: 'Bình hoa',
    },
    {
      name: 'Bộ bát đĩa Bát Tràng cao cấp',
      description:
        'Bộ 10 bát 10 đĩa vẽ vàng 24k, họa tiết rồng phượng, thích hợp cho các dịp lễ tết.',
      price: 5500000,
      quantity: 8,
      tags: ['bát đĩa', 'bát tràng', 'vẽ vàng', 'cao cấp'],
      isCustomizable: true,
      category: 'Bát đĩa',
    },
    // Đồ gỗ
    {
      name: 'Tượng Phật Di Lặc gỗ hương',
      description: 'Tượng Phật Di Lặc cao 50cm, chạm khắc tinh xảo từ gỗ hương nguyên khối.',
      price: 15000000,
      quantity: 3,
      tags: ['tượng gỗ', 'phật di lặc', 'gỗ hương', 'phong thủy'],
      isCustomizable: false,
      category: 'Tượng gỗ',
    },
    {
      name: 'Bàn trà gỗ gụ',
      description: 'Bàn trà kiểu cổ điển, gỗ gụ nguyên khối, kích thước 120x60x40cm.',
      price: 25000000,
      discountPrice: 22000000,
      quantity: 2,
      tags: ['bàn trà', 'gỗ gụ', 'nội thất', 'cổ điển'],
      isCustomizable: true,
      category: 'Đồ nội thất',
    },
    {
      name: 'Hộp đựng trang sức gỗ trắc',
      description: 'Hộp gỗ trắc 3 tầng, khảm trai, phù hợp làm quà tặng cao cấp.',
      price: 3500000,
      quantity: 10,
      tags: ['hộp gỗ', 'gỗ trắc', 'trang sức', 'quà tặng'],
      isCustomizable: false,
      category: 'Đồ lưu niệm',
    },
    // Thêu thùa
    {
      name: 'Tranh thêu Đồng Quê Việt Nam',
      description: 'Tranh thêu tay 100% lụa tơ tằm, kích thước 80x60cm, khung gỗ gụ.',
      price: 8500000,
      quantity: 5,
      tags: ['tranh thêu', 'đồng quê', 'lụa', 'thủ công'],
      isCustomizable: false,
      category: 'Tranh thêu',
    },
    {
      name: 'Áo dài thêu hoa sen',
      description: 'Áo dài lụa thêu tay hoa sen, may đo theo yêu cầu, thời gian 15-20 ngày.',
      price: 4500000,
      quantity: 0,
      tags: ['áo dài', 'thêu tay', 'hoa sen', 'đặt may'],
      isCustomizable: true,
      category: 'Áo dài thêu',
    },
    {
      name: 'Khăn choàng thêu họa tiết dân tộc',
      description: "Khăn choàng lụa thêu họa tiết dân tộc H'Mông, kích thước 180x60cm.",
      price: 1200000,
      quantity: 25,
      tags: ['khăn thêu', 'dân tộc', "h'mông", 'thời trang'],
      isCustomizable: false,
      category: 'Khăn thêu',
    },
    // Tranh vẽ
    {
      name: 'Tranh sơn dầu Phố cổ Hà Nội',
      description: 'Tranh sơn dầu vẽ tay, kích thước 100x70cm, phong cảnh phố cổ Hà Nội.',
      price: 12000000,
      quantity: 1,
      tags: ['tranh sơn dầu', 'phố cổ', 'hà nội', 'nghệ thuật'],
      isCustomizable: false,
      category: 'Tranh sơn dầu',
    },
    {
      name: 'Tranh lụa Cô gái Việt',
      description: 'Tranh vẽ trên lụa, chân dung cô gái Việt trong tà áo dài, 60x40cm.',
      price: 6500000,
      quantity: 3,
      tags: ['tranh lụa', 'chân dung', 'áo dài', 'việt nam'],
      isCustomizable: false,
      category: 'Tranh lụa',
    },
    {
      name: 'Bộ tranh Đông Hồ 12 con giáp',
      description: 'Bộ 12 tranh Đông Hồ truyền thống, in từ bản khắc gỗ, khung tre.',
      price: 3600000,
      discountPrice: 3000000,
      quantity: 10,
      tags: ['tranh đông hồ', '12 con giáp', 'dân gian', 'truyền thống'],
      isCustomizable: false,
      category: 'Tranh Đông Hồ',
    },
    // Đồ da
    {
      name: 'Ví da bò handmade',
      description: 'Ví da bò thật 100%, may thủ công, nhiều ngăn tiện dụng, khắc tên miễn phí.',
      price: 850000,
      quantity: 30,
      tags: ['ví da', 'da bò', 'handmade', 'khắc tên'],
      isCustomizable: true,
      category: 'Ví da',
    },
    {
      name: 'Túi xách da vintage',
      description: 'Túi xách da bò wax, phong cách vintage, kích thước 35x25x10cm.',
      price: 2800000,
      quantity: 15,
      tags: ['túi xách', 'da bò', 'vintage', 'thời trang'],
      isCustomizable: false,
      category: 'Túi xách',
    },
    {
      name: 'Giày da nam Oxford',
      description: 'Giày da bò cao cấp, đế da, may Blake, size 38-44.',
      price: 3500000,
      discountPrice: 3200000,
      quantity: 20,
      tags: ['giày da', 'oxford', 'nam', 'cao cấp'],
      isCustomizable: true,
      category: 'Giày dép',
    },
  ];

  // Phân bổ sản phẩm cho các artisan
  for (let i = 0; i < productData.length; i++) {
    const artisan = artisans[i % artisans.length]!;
    const productInfo = productData[i]!;
    const productCategory = categories.find((c) => c.name === productInfo.category);

    const product = await prisma.product.create({
      data: {
        sellerId: artisan.id,
        name: productInfo.name,
        slug: generateSlug(productInfo.name),
        description: productInfo.description,
        price: productInfo.price,
        discountPrice: productInfo.discountPrice || null,
        quantity: productInfo.quantity,
        status: productInfo.quantity > 0 ? 'PUBLISHED' : 'OUT_OF_STOCK',
        images: generateProductImages(i, 3),
        tags: productInfo.tags,
        isCustomizable: productInfo.isCustomizable,
        avgRating: 4 + Math.random() * 0.9,
        reviewCount: Math.floor(Math.random() * 50) + 10,
        viewCount: Math.floor(Math.random() * 1000) + 100,
        salesCount: Math.floor(Math.random() * 100) + 10,
      },
    });

    // Link với category
    if (productCategory) {
      await prisma.categoryProduct.create({
        data: {
          categoryId: productCategory.id,
          productId: product.id,
        },
      });
    }

    // Tạo price history
    await prisma.priceHistory.create({
      data: {
        productId: product.id,
        price: product.price,
        changeNote: 'Giá khởi tạo',
      },
    });

    products.push(product);
  }

  return products;
}

async function createPosts(users: UserData[]) {
  const posts = [];
  const artisans = users.filter((u) => u.role === 'ARTISAN');
  const allUsers = [...users];

  const postData: PostData[] = [
    {
      title: 'Quy trình làm gốm sứ Bát Tràng truyền thống',
      summary:
        'Khám phá quy trình làm gốm sứ thủ công tại làng nghề Bát Tràng với hơn 700 năm lịch sử.',
      content: {
        blocks: [
          {
            type: 'paragraph',
            content:
              'Làng gốm Bát Tràng có lịch sử hơn 700 năm, nổi tiếng với những sản phẩm gốm sứ tinh xảo...',
          },
          {
            type: 'image',
            url: 'https://picsum.photos/800/600',
            caption: 'Nghệ nhân đang tạo hình sản phẩm',
          },
        ],
      },
      type: 'BEHIND_THE_SCENES',
      tags: ['gốm sứ', 'bát tràng', 'làng nghề', 'thủ công'],
    },
    {
      title: 'Hướng dẫn chăm sóc đồ gỗ đúng cách',
      summary: 'Những bí quyết giúp đồ gỗ của bạn luôn bền đẹp theo thời gian.',
      content: {
        blocks: [
          {
            type: 'paragraph',
            content: 'Đồ gỗ cần được chăm sóc đúng cách để giữ được vẻ đẹp tự nhiên...',
          },
        ],
      },
      type: 'TUTORIAL',
      tags: ['đồ gỗ', 'bảo quản', 'mẹo hay'],
    },
    {
      title: 'Bộ sưu tập tranh thêu Xuân 2024',
      summary: 'Giới thiệu bộ sưu tập tranh thêu tay mới nhất với chủ đề mùa xuân.',
      content: {
        blocks: [
          {
            type: 'paragraph',
            content: 'Xuân về, chúng tôi xin giới thiệu bộ sưu tập tranh thêu tay độc đáo...',
          },
        ],
      },
      type: 'PRODUCT_SHOWCASE',
      tags: ['tranh thêu', 'xuân 2024', 'bộ sưu tập', 'nghệ thuật'],
    },
    {
      title: 'Câu chuyện về nghề làm tranh sơn mài',
      summary: 'Hành trình 30 năm gắn bó với nghề của nghệ nhân Nguyễn Văn A.',
      content: {
        blocks: [
          {
            type: 'paragraph',
            content: 'Tôi bắt đầu học nghề từ năm 15 tuổi, theo cha vào xưởng sơn mài...',
          },
        ],
      },
      type: 'STORY',
      tags: ['sơn mài', 'nghệ nhân', 'câu chuyện', 'truyền thống'],
    },
    {
      title: 'Triển lãm Thủ công mỹ nghệ Việt Nam 2024',
      summary: 'Thông tin về triển lãm thủ công mỹ nghệ lớn nhất năm tại Hà Nội.',
      content: {
        blocks: [
          {
            type: 'paragraph',
            content: 'Triển lãm sẽ diễn ra từ ngày 15-20/3/2024 tại Cung Văn hóa Hữu nghị...',
          },
        ],
      },
      type: 'EVENT',
      tags: ['triển lãm', 'sự kiện', 'thủ công mỹ nghệ', 'hà nội'],
    },
    {
      title: 'Xu hướng đồ da thủ công 2024',
      summary: 'Những xu hướng mới trong thiết kế và sản xuất đồ da thủ công.',
      content: {
        blocks: [
          {
            type: 'paragraph',
            content: 'Năm 2024 chứng kiến sự trở lại của phong cách vintage trong đồ da...',
          },
        ],
      },
      type: 'GENERAL',
      tags: ['đồ da', 'xu hướng', '2024', 'thời trang'],
    },
    {
      title: 'Bí quyết chọn gốm sứ phong thủy',
      summary: 'Hướng dẫn chọn đồ gốm sứ phù hợp với phong thủy gia đình.',
      content: {
        blocks: [
          {
            type: 'paragraph',
            content: 'Trong phong thủy, gốm sứ không chỉ là vật trang trí mà còn mang ý nghĩa...',
          },
        ],
      },
      type: 'GENERAL',
      tags: ['gốm sứ', 'phong thủy', 'trang trí', 'gia đình'],
    },
    {
      title: 'Quy trình dệt lụa tơ tằm truyền thống',
      summary: 'Khám phá quy trình dệt lụa tơ tằm thủ công tại Bảo Lộc.',
      content: {
        blocks: [
          {
            type: 'paragraph',
            content: 'Từ việc nuôi tằm, ươm tơ đến dệt thành phẩm, mỗi công đoạn đều đòi hỏi...',
          },
        ],
      },
      type: 'BEHIND_THE_SCENES',
      tags: ['tơ lụa', 'bảo lộc', 'thủ công', 'quy trình'],
    },
    {
      title: 'Kỹ thuật chạm khắc gỗ cơ bản',
      summary: 'Hướng dẫn từng bước cho người mới bắt đầu học chạm khắc gỗ.',
      content: {
        blocks: [
          {
            type: 'paragraph',
            content: 'Chạm khắc gỗ là nghệ thuật đòi hỏi sự kiên nhẫn và tỉ mỉ...',
          },
        ],
      },
      type: 'TUTORIAL',
      tags: ['chạm khắc', 'gỗ', 'hướng dẫn', 'cơ bản'],
    },
    {
      title: 'Bộ sưu tập áo dài thêu Tết Nguyên Đán',
      summary: 'Giới thiệu các mẫu áo dài thêu tay độc quyền cho dịp Tết.',
      content: {
        blocks: [
          {
            type: 'paragraph',
            content: 'Tết Nguyên Đán là dịp để phái đẹp Việt khoe sắc trong tà áo dài...',
          },
        ],
      },
      type: 'PRODUCT_SHOWCASE',
      tags: ['áo dài', 'tết', 'thêu tay', 'thời trang'],
    },
  ];

  for (let i = 0; i < postData.length; i++) {
    const author =
      i < 5
        ? artisans[i % artisans.length]!
        : allUsers[Math.floor(Math.random() * allUsers.length)]!;
    const postInfo = postData[i]!;

    const post = await prisma.post.create({
      data: {
        userId: author.id,
        title: postInfo.title,
        slug: generateSlug(postInfo.title),
        summary: postInfo.summary,
        content: postInfo.content,
        contentText: postInfo.content.blocks.map((b) => b.content || '').join(' '),
        type: postInfo.type,
        status: Math.random() > 0.2 ? 'PUBLISHED' : 'DRAFT',
        thumbnailUrl: `https://picsum.photos/seed/post-${i}/400/300`,
        coverImage: `https://picsum.photos/seed/post-${i}-cover/1200/600`,
        mediaUrls: generateProductImages(i, 2),
        tags: postInfo.tags,
        viewCount: Math.floor(Math.random() * 5000) + 100,
        likeCount: Math.floor(Math.random() * 500) + 10,
        commentCount: Math.floor(Math.random() * 100) + 5,
        shareCount: Math.floor(Math.random() * 50),
        publishedAt:
          Math.random() > 0.2
            ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
            : null,
      },
    });

    // Tạo PostAnalytics
    await prisma.postAnalytics.create({
      data: {
        postId: post.id,
        viewCount: post.viewCount,
        uniqueViewers: Math.floor(post.viewCount * 0.7),
        avgReadTime: 2.5 + Math.random() * 2,
        conversionCount: Math.floor(Math.random() * 20),
      },
    });

    posts.push(post);
  }

  return posts;
}

async function createFollows(users: UserData[]) {
  interface FollowRecord {
    followerId: string;
    followingId: string;
  }

  const follows: FollowRecord[] = [];

  // Mỗi user follow 2-5 users khác
  for (const follower of users) {
    const followCount = Math.floor(Math.random() * 4) + 2;
    const otherUsers = users.filter((u) => u.id !== follower.id);

    for (let i = 0; i < followCount && i < otherUsers.length; i++) {
      const following = otherUsers[Math.floor(Math.random() * otherUsers.length)]!;

      // Kiểm tra chưa follow
      const exists = follows.some(
        (f) => f.followerId === follower.id && f.followingId === following.id,
      );

      if (!exists && following.id !== follower.id) {
        const follow = await prisma.follow.create({
          data: {
            followerId: follower.id,
            followingId: following.id,
            notifyNewPosts: Math.random() > 0.3,
          },
        });
        follows.push({ followerId: follow.followerId, followingId: follow.followingId });
      }
    }
  }
}

async function createLikesAndSavedPosts(users: UserData[], posts: any[]) {
  // Likes
  for (const user of users) {
    const likeCount = Math.floor(Math.random() * 10) + 5;
    const postsToLike = posts.sort(() => 0.5 - Math.random()).slice(0, likeCount);

    for (const post of postsToLike) {
      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
          reaction: Math.random() > 0.9 ? 'love' : 'like',
        },
      });
    }
  }

  // Saved posts
  for (const user of users) {
    const saveCount = Math.floor(Math.random() * 5) + 2;
    const postsToSave = posts.sort(() => 0.5 - Math.random()).slice(0, saveCount);

    for (const post of postsToSave) {
      await prisma.savedPost.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });
    }
  }
}

async function createComments(users: UserData[], posts: any[]) {
  const comments = [];

  const commentTexts = [
    'Sản phẩm rất đẹp, tôi rất thích!',
    'Nghệ nhân làm rất tỉ mỉ và chuyên nghiệp.',
    'Giá cả hợp lý, chất lượng tốt.',
    'Đã mua và rất hài lòng với sản phẩm.',
    'Có ship ra nước ngoài không ạ?',
    'Mình muốn đặt với số lượng lớn thì có giảm giá không?',
    'Thời gian giao hàng bao lâu vậy shop?',
    'Sản phẩm có bảo hành không ạ?',
    'Rất ấn tượng với chất lượng!',
    'Đóng gói cẩn thận, giao hàng nhanh.',
    'Mình đã giới thiệu cho bạn bè rồi.',
    'Có thể custom theo yêu cầu không?',
    'Màu sắc có đúng như hình không ạ?',
    'Shop có showroom để xem trực tiếp không?',
    'Chất liệu có bền không shop?',
  ];

  for (const post of posts.slice(0, 10)) {
    const commentCount = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < commentCount; i++) {
      const commenter = users[Math.floor(Math.random() * users.length)]!;
      const commentText = commentTexts[Math.floor(Math.random() * commentTexts.length)]!;
      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          userId: commenter.id,
          content: commentText,
          likeCount: Math.floor(Math.random() * 20),
        },
      });

      comments.push(comment);

      // Tạo replies
      if (Math.random() > 0.5) {
        const replyCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < replyCount; j++) {
          const replier = users[Math.floor(Math.random() * users.length)]!;
          const replyText = commentTexts[Math.floor(Math.random() * commentTexts.length)]!;
          await prisma.comment.create({
            data: {
              postId: post.id,
              userId: replier.id,
              parentId: comment.id,
              content: replyText,
              likeCount: Math.floor(Math.random() * 10),
            },
          });
        }
      }
    }
  }
}

async function createReviews(users: UserData[], products: any[]) {
  const customers = users.filter((u) => u.role === 'CUSTOMER');

  const reviewTexts = [
    {
      rating: 5,
      title: 'Sản phẩm tuyệt vời!',
      comment: 'Chất lượng vượt mong đợi, đóng gói cẩn thận. Sẽ ủng hộ shop dài dài.',
    },
    {
      rating: 5,
      title: 'Rất hài lòng',
      comment: 'Sản phẩm đúng như mô tả, chất lượng tốt, giá cả hợp lý.',
    },
    {
      rating: 4,
      title: 'Tốt nhưng cần cải thiện',
      comment: 'Sản phẩm đẹp, chất lượng ổn. Tuy nhiên thời gian giao hàng hơi lâu.',
    },
    {
      rating: 4,
      title: 'Đáng mua',
      comment: 'Sản phẩm đẹp, phù hợp với giá tiền. Shop phục vụ nhiệt tình.',
    },
    {
      rating: 5,
      title: 'Xuất sắc!',
      comment: 'Đây là lần thứ 3 mình mua hàng của shop. Luôn hài lòng với chất lượng.',
    },
    {
      rating: 3,
      title: 'Tạm ổn',
      comment: 'Sản phẩm ổn nhưng màu sắc hơi khác so với hình ảnh.',
    },
    {
      rating: 5,
      title: 'Quá tuyệt vời',
      comment: 'Mua làm quà tặng, người nhận rất thích. Cảm ơn shop!',
    },
    {
      rating: 4,
      title: 'Chất lượng tốt',
      comment: 'Sản phẩm làm thủ công rất tinh xảo, đáng đồng tiền bát gạo.',
    },
    {
      rating: 5,
      title: 'Sẽ quay lại',
      comment: 'Shop tư vấn nhiệt tình, sản phẩm chất lượng. Chắc chắn sẽ mua lại.',
    },
    {
      rating: 5,
      title: 'Hoàn hảo',
      comment: 'Không có gì để chê, từ sản phẩm đến dịch vụ đều tuyệt vời.',
    },
  ];

  for (const product of products) {
    const reviewCount = Math.floor(Math.random() * 5) + 2;
    const reviewers = customers.sort(() => 0.5 - Math.random()).slice(0, reviewCount);

    for (const reviewer of reviewers) {
      const reviewData = reviewTexts[Math.floor(Math.random() * reviewTexts.length)]!;
      await prisma.review.create({
        data: {
          userId: reviewer.id,
          productId: product.id,
          rating: reviewData.rating,
          title: reviewData.title,
          comment: reviewData.comment,
          images: Math.random() > 0.7 ? generateProductImages(product.id, 2) : [],
        },
      });
    }
  }
}

async function createCartItems(users: UserData[], products: any[]) {
  const customers = users.filter((u) => u.role === 'CUSTOMER');

  for (const customer of customers) {
    const cartItemCount = Math.floor(Math.random() * 3) + 1;
    const productsInCart = products.sort(() => 0.5 - Math.random()).slice(0, cartItemCount);

    for (const product of productsInCart) {
      await prisma.cartItem.create({
        data: {
          userId: customer.id,
          productId: product.id,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: product.discountPrice || product.price,
        },
      });
    }
  }
}

async function createOrders(users: UserData[], products: any[]) {
  const customers = users.filter((u) => u.role === 'CUSTOMER');
  const orders = [];

  for (const customer of customers.slice(0, 8)) {
    // Lấy địa chỉ mặc định của customer
    const profile = await prisma.profile.findUnique({
      where: { userId: customer.id },
      include: { addresses: { where: { isDefault: true } } },
    });

    const orderCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < orderCount; i++) {
      const orderProducts = products
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1);
      const orderItems = orderProducts.map((p: any) => ({
        productId: p.id,
        sellerId: p.sellerId,
        quantity: Math.floor(Math.random() * 2) + 1,
        price: p.discountPrice || p.price,
      }));

      const subtotal = orderItems.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      );
      const shippingCost = 30000;

      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: customer.id,
          addressId: profile?.addresses[0]?.id || null,
          status: getRandomOrderStatus(),
          paymentStatus: getRandomPaymentStatus(),
          totalAmount: subtotal + shippingCost,
          subtotal: subtotal,
          shippingCost: shippingCost,
          paymentMethod: getRandomPaymentMethod(),
          notes: Math.random() > 0.7 ? 'Giao giờ hành chính, gọi trước khi giao' : null,
          trackingNumber: Math.random() > 0.5 ? generateTrackingNumber() : null,
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          deliveredAt:
            Math.random() > 0.7
              ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
              : null,
          items: {
            create: orderItems,
          },
        },
      });

      orders.push(order);
    }
  }

  return orders;
}

async function createQuoteRequests(users: UserData[], products: any[]) {
  const customers = users.filter((u) => u.role === 'CUSTOMER');
  const customizableProducts = products.filter((p: any) => p.isCustomizable);

  const quoteMessages = [
    {
      customer: 'Tôi muốn đặt 50 chiếc với logo công ty, có được không?',
      artisan: 'Dạ được ạ, với số lượng 50 chiếc em báo giá ... đồng/chiếc đã bao gồm khắc logo.',
      specifications: 'Số lượng: 50 chiếc\nYêu cầu: Khắc logo công ty',
    },
    {
      customer: 'Có thể làm kích thước 1m2 được không? Tôi cần trang trí sảnh khách sạn.',
      artisan: 'Chúng tôi có thể làm kích thước theo yêu cầu. Với kích thước 1m2, giá sẽ là ...',
      specifications: 'Kích thước: 1m x 1m\nMục đích: Trang trí sảnh khách sạn',
    },
    {
      customer: 'Tôi muốn thay đổi màu sắc theo phong thủy, có tư vấn được không?',
      artisan:
        'Dạ, chúng tôi có thể tư vấn và làm theo màu sắc phong thủy phù hợp với tuổi và mệnh của quý khách.',
      specifications: 'Yêu cầu: Màu sắc theo phong thủy\nCần tư vấn chọn màu',
    },
  ];

  const maxItems = Math.min(10, customizableProducts.length);

  for (let i = 0; i < maxItems; i++) {
    const customer = customers[i % customers.length]!;
    const product = customizableProducts[i % customizableProducts.length]!;
    const quoteData = quoteMessages[i % quoteMessages.length]!;

    const quote = await prisma.quoteRequest.create({
      data: {
        productId: product.id,
        customerId: customer.id,
        artisanId: product.sellerId,
        requestedPrice: Number(product.price) * 0.9,
        specifications: quoteData.specifications,
        status: getRandomQuoteStatus(),
        counterOffer: Math.random() > 0.5 ? Number(product.price) * 0.95 : null,
        finalPrice: Math.random() > 0.7 ? Number(product.price) * 0.93 : null,
        customerMessage: quoteData.customer,
        artisanMessage: Math.random() > 0.3 ? quoteData.artisan : null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Tạo negotiation history
    await prisma.quoteNegotiation.create({
      data: {
        quoteId: quote.id,
        action: 'REQUEST',
        actor: 'customer',
        newPrice: quote.requestedPrice,
        message: quote.customerMessage,
      },
    });

    if (quote.artisanMessage) {
      await prisma.quoteNegotiation.create({
        data: {
          quoteId: quote.id,
          action: quote.counterOffer ? 'COUNTER' : 'MESSAGE',
          actor: 'artisan',
          previousPrice: quote.requestedPrice,
          newPrice: quote.counterOffer,
          message: quote.artisanMessage,
        },
      });
    }
  }
}

async function createMessages(users: UserData[]) {
  const messageTemplates = [
    {
      type: 'TEXT' as const,
      content: 'Chào shop, sản phẩm này còn hàng không ạ?',
    },
    {
      type: 'TEXT' as const,
      content: 'Dạ còn hàng ạ. Anh/chị cần tư vấn gì thêm không ạ?',
    },
    {
      type: 'TEXT' as const,
      content: 'Shop có thể làm theo yêu cầu riêng không?',
    },
    {
      type: 'TEXT' as const,
      content: 'Dạ được ạ, anh/chị cho em biết yêu cầu cụ thể để em báo giá.',
    },
    {
      type: 'TEXT' as const,
      content: 'Giao hàng trong bao lâu vậy shop?',
    },
    {
      type: 'TEXT' as const,
      content: 'Dạ, nếu có sẵn thì 2-3 ngày, đặt làm thì 7-10 ngày ạ.',
    },
    {
      type: 'IMAGE' as const,
      content: 'Đây là mẫu em vừa làm xong, anh chị xem thử.',
    },
    {
      type: 'QUOTE_DISCUSSION' as const,
      content: 'Em gửi báo giá chi tiết cho đơn hàng của anh/chị.',
    },
    {
      type: 'TEXT' as const,
      content: 'Cảm ơn shop, để mình suy nghĩ thêm.',
    },
    {
      type: 'TEXT' as const,
      content: 'Dạ, anh/chị cứ suy nghĩ kỹ, có gì cứ liên hệ em ạ.',
    },
  ];

  // Tạo conversations giữa customers và artisans
  const customers = users.filter((u) => u.role === 'CUSTOMER');
  const artisans = users.filter((u) => u.role === 'ARTISAN');

  for (let i = 0; i < 20; i++) {
    const customer = customers[i % customers.length]!;
    const artisan = artisans[i % artisans.length]!;
    const isCustomerFirst = Math.random() > 0.5;

    const sender = isCustomerFirst ? customer : artisan;
    const receiver = isCustomerFirst ? artisan : customer;

    const messageData = messageTemplates[i % messageTemplates.length]!;

    // Sử dụng conditional object creation
    const messageCreateData: any = {
      senderId: sender.id,
      receiverId: receiver.id,
      content: messageData.content,
      type: messageData.type,
      isRead: Math.random() > 0.3,
    };

    // Chỉ thêm metadata nếu cần thiết
    if (messageData.type === 'IMAGE') {
      messageCreateData.metadata = { url: `https://picsum.photos/seed/msg-${i}/400/300` };
    }

    await prisma.message.create({
      data: messageCreateData,
    });
  }
}

async function createNotifications(users: UserData[]) {
  const notificationTemplates = [
    {
      type: 'LIKE' as const,
      title: 'Bài viết của bạn được thích',
      message: '{sender} đã thích bài viết "{postTitle}"',
    },
    {
      type: 'COMMENT' as const,
      title: 'Bình luận mới',
      message: '{sender} đã bình luận về bài viết của bạn',
    },
    {
      type: 'FOLLOW' as const,
      title: 'Người theo dõi mới',
      message: '{sender} đã bắt đầu theo dõi bạn',
    },
    {
      type: 'ORDER_UPDATE' as const,
      title: 'Cập nhật đơn hàng',
      message: 'Đơn hàng #{orderNumber} của bạn đã được {status}',
    },
    {
      type: 'QUOTE_REQUEST' as const,
      title: 'Yêu cầu báo giá mới',
      message: '{sender} đã gửi yêu cầu báo giá cho sản phẩm của bạn',
    },
    {
      type: 'MESSAGE' as const,
      title: 'Tin nhắn mới',
      message: '{sender} đã gửi tin nhắn cho bạn',
    },
    {
      type: 'PAYMENT_SUCCESS' as const,
      title: 'Thanh toán thành công',
      message: 'Thanh toán cho đơn hàng #{orderNumber} đã thành công',
    },
    {
      type: 'SYSTEM' as const,
      title: 'Thông báo hệ thống',
      message: 'Tài khoản của bạn đã được xác thực thành công',
    },
  ];

  for (const user of users) {
    const notificationCount = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < notificationCount; i++) {
      const template =
        notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)]!;
      const otherUsers = users.filter((u) => u.id !== user.id);
      const sender = otherUsers[Math.floor(Math.random() * otherUsers.length)]!;

      let message = template.message;
      let data: any = {};

      switch (template.type) {
        case 'LIKE':
        case 'COMMENT':
          message = message.replace('{sender}', `${sender.firstName} ${sender.lastName}`);
          message = message.replace('{postTitle}', 'Quy trình làm gốm sứ Bát Tràng');
          data = { postId: 'some-post-id' };
          break;
        case 'FOLLOW':
        case 'QUOTE_REQUEST':
        case 'MESSAGE':
          message = message.replace('{sender}', `${sender.firstName} ${sender.lastName}`);
          data = { senderId: sender.id };
          break;
        case 'ORDER_UPDATE':
        case 'PAYMENT_SUCCESS':
          message = message.replace('{orderNumber}', generateOrderNumber());
          message = message.replace('{status}', 'xác nhận');
          data = { orderId: 'some-order-id' };
          break;
      }

      await prisma.notification.create({
        data: {
          recipientId: user.id,
          senderId: template.type === 'SYSTEM' ? null : sender.id,
          type: template.type,
          title: template.title,
          message,
          data,
          isRead: Math.random() > 0.6,
        },
      });
    }
  }
}

// Helper functions
function getRandomLocation(): string {
  const locations = [
    'Hà Nội',
    'TP. Hồ Chí Minh',
    'Đà Nẵng',
    'Huế',
    'Hội An',
    'Nha Trang',
    'Đà Lạt',
    'Cần Thơ',
    'Hải Phòng',
    'Quảng Ninh',
  ];
  return locations[Math.floor(Math.random() * locations.length)]!;
}

function generatePhoneNumber(): string {
  const prefixes = ['090', '091', '092', '093', '094', '096', '097', '098', '086', '088'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]!;
  const number = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, '0');
  return prefix + number;
}

function generateAddress(): {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
} {
  const streets = [
    'Nguyễn Huệ',
    'Lê Lợi',
    'Trần Hưng Đạo',
    'Nguyễn Trãi',
    'Lý Thường Kiệt',
    'Hai Bà Trưng',
    'Nguyễn Văn Cừ',
    'Võ Văn Tần',
    'Phan Chu Trinh',
    'Điện Biên Phủ',
  ];

  const districts = [
    { city: 'Hà Nội', districts: ['Hoàn Kiếm', 'Ba Đình', 'Đống Đa', 'Hai Bà Trưng', 'Cầu Giấy'] },
    { city: 'TP. Hồ Chí Minh', districts: ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 7', 'Bình Thạnh'] },
    {
      city: 'Đà Nẵng',
      districts: ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu'],
    },
  ];

  const cityData = districts[Math.floor(Math.random() * districts.length)]!;
  const district = cityData.districts[Math.floor(Math.random() * cityData.districts.length)]!;

  return {
    street: `${Math.floor(Math.random() * 200) + 1} ${streets[Math.floor(Math.random() * streets.length)]!}`,
    city: cityData.city,
    state: district,
    zipCode: (100000 + Math.floor(Math.random() * 900000)).toString(),
    country: 'Việt Nam',
  };
}

function generateSlug(text: string): string {
  const from = 'àáäâãåăæçèéëêìíïîòóöôõøùúüûñńñšžđðßÿýÀÁÄÂÃÅĂÆÇÈÉËÊÌÍÏÎÒÓÖÔÕØÙÚÜÛÑŃÑŠŽĐÐßÿÝ';
  const to = 'aaaaaaaaaceeeeiiiiooooooouuuunnnszddsyyAAAAAAAACEEEEIIIIOOOOOOOUUUUNNNSZDDsyY';

  let slug = text.toLowerCase();

  for (let i = 0; i < from.length; i++) {
    slug = slug.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  return slug
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function generateProductImages(seed: any, count: number): string[] {
  const images = [];
  for (let i = 0; i < count; i++) {
    images.push(`https://picsum.photos/seed/${seed}-${i}/800/600`);
  }
  return images;
}

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `ORD${year}${month}${random}`;
}

function generateTrackingNumber(): string {
  const carriers = ['VNP', 'GHN', 'JT', 'SPX'];
  const carrier = carriers[Math.floor(Math.random() * carriers.length)]!;
  const number = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, '0');
  return `${carrier}${number}`;
}

function getRandomOrderStatus(): any {
  const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  return statuses[Math.floor(Math.random() * statuses.length)]!;
}

function getRandomPaymentStatus(): any {
  const statuses = ['PENDING', 'COMPLETED', 'FAILED'];
  return statuses[Math.floor(Math.random() * statuses.length)]!;
}

function getRandomPaymentMethod(): any {
  const methods = ['BANK_TRANSFER', 'CASH_ON_DELIVERY', 'DIGITAL_WALLET'];
  return methods[Math.floor(Math.random() * methods.length)]!;
}

function getRandomQuoteStatus(): any {
  const statuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'COUNTER_OFFERED'];
  return statuses[Math.floor(Math.random() * statuses.length)]!;
}

// Run seeding
main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
