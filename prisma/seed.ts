import { PrismaClient } from '@prisma/client';
import {
  AttributeType,
  ProductStatus,
  PostType,
  PostStatus,
  NegotiationStatus,
  QuoteStatus,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  DeliveryStatus,
  WishlistItemType,
  MessageType,
  NotificationType,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed data...');

  // =====================================================
  // 1. USERS - Admin, Artisan, Customer
  // =====================================================

  const hashedPassword = await bcrypt.hash('123456789', 12);

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      email: 'admin@artisanconnect.vn',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Quản Trị',
      lastName: 'Viên',
      role: 'ADMIN',
      status: 'ACTIVE',
      bio: 'Quản trị viên hệ thống Artisan Connect Việt Nam',
      avatarUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/avatars/admin.jpg',
      isVerified: true,
      emailVerified: true,
      phone: '+84901234567',
      lastSeenAt: new Date(),
    },
  });

  // Artisans
  await prisma.user.createMany({
    data: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'mai.gom.su@gmail.com',
        username: 'mai_gom_su',
        password: hashedPassword,
        firstName: 'Nguyễn Thị',
        lastName: 'Mai',
        role: 'ARTISAN',
        status: 'ACTIVE',
        bio: 'Nghệ nhân gốm sứ Bát Tràng với 15 năm kinh nghiệm. Chuyên tạo ra những sản phẩm gốm sứ tinh xảo mang đậm nét văn hóa Việt.',
        avatarUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/avatars/mai-gom-su.jpg',
        isVerified: true,
        emailVerified: true,
        phone: '+84987654321',
        followerCount: 1250,
        followingCount: 45,
        lastSeenAt: new Date(),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'long.tre.hue@gmail.com',
        username: 'long_tre_hue',
        password: hashedPassword,
        firstName: 'Trần Văn',
        lastName: 'Long',
        role: 'ARTISAN',
        status: 'ACTIVE',
        bio: 'Thợ thủ công tre nứa truyền thống Huế. Tôi làm ra những sản phẩm từ tre nứa như giỏ, thúng, nón lá... vừa đẹp vừa thân thiện với môi trường.',
        avatarUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/avatars/long-tre.jpg',
        isVerified: true,
        emailVerified: true,
        phone: '+84912345678',
        followerCount: 890,
        followingCount: 32,
        lastSeenAt: new Date(),
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'hong.theu.dong@gmail.com',
        username: 'hong_theu_dong',
        password: hashedPassword,
        firstName: 'Lê Thị',
        lastName: 'Hồng',
        role: 'ARTISAN',
        status: 'ACTIVE',
        bio: 'Nghệ nhân thêu đồng truyền thống với 20 năm kinh nghiệm. Chuyên thêu tranh, quần áo áo dài và các sản phẩm thời trang cao cấp.',
        avatarUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/avatars/hong-theu.jpg',
        isVerified: false,
        emailVerified: true,
        phone: '+84923456789',
        followerCount: 567,
        followingCount: 28,
        lastSeenAt: new Date(),
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'duc.moc.hoi.an@gmail.com',
        username: 'duc_moc_hoi_an',
        password: hashedPassword,
        firstName: 'Phạm Văn',
        lastName: 'Đức',
        role: 'ARTISAN',
        status: 'ACTIVE',
        bio: 'Thợ mộc Kim Bồng, Hội An. Tôi chế tác các sản phẩm nội thất, đồ thờ và nghệ thuật từ gỗ quý theo phong cách truyền thống Việt Nam.',
        avatarUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/avatars/duc-moc.jpg',
        isVerified: true,
        emailVerified: true,
        phone: '+84934567890',
        followerCount: 743,
        followingCount: 18,
        lastSeenAt: new Date(),
      },
    ],
  });

  // Customers
  await prisma.user.createMany({
    data: [
      {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'linh.nguyen@gmail.com',
        username: 'linh_nguyen',
        password: hashedPassword,
        firstName: 'Nguyễn Thúy',
        lastName: 'Linh',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        bio: 'Yêu thích đồ thủ công truyền thống Việt Nam',
        avatarUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/avatars/linh.jpg',
        isVerified: false,
        emailVerified: true,
        phone: '+84945678901',
        followingCount: 12,
        lastSeenAt: new Date(),
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        email: 'minh.tran@gmail.com',
        username: 'minh_tran',
        password: hashedPassword,
        firstName: 'Trần Hoàng',
        lastName: 'Minh',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        bio: 'Sưu tập các sản phẩm gốm sứ và tranh thêu',
        avatarUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/avatars/minh.jpg',
        isVerified: false,
        emailVerified: true,
        phone: '+84956789012',
        followingCount: 8,
        lastSeenAt: new Date(),
      },
      {
        id: '77777777-7777-7777-7777-777777777777',
        email: 'thu.pham@gmail.com',
        username: 'thu_pham',
        password: hashedPassword,
        firstName: 'Phạm Thị',
        lastName: 'Thu',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        bio: 'Đam mê nghệ thuật dân gian Việt Nam',
        avatarUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/avatars/thu.jpg',
        isVerified: false,
        emailVerified: true,
        phone: '+84967890123',
        followingCount: 15,
        lastSeenAt: new Date(),
      },
    ],
  });

  // =====================================================
  // 2. PROFILES & ADDRESSES
  // =====================================================

  // Admin Profile
  await prisma.profile.create({
    data: {
      userId: adminUser.id,
      location: 'Hà Nội, Việt Nam',
      website: 'https://artisanconnect.vn',
      socialLinks: {
        facebook: 'https://facebook.com/artisanconnectvn',
        instagram: 'https://instagram.com/artisanconnectvn',
      },
      preferences: {
        language: 'vi',
        currency: 'VND',
        notifications: true,
      },
    },
  });

  // Artisan Profiles
  const profilesData = [
    {
      userId: '11111111-1111-1111-1111-111111111111',
      location: 'Bát Tràng, Gia Lâm, Hà Nội',
      website: 'https://mai-gom-su.vn',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'female',
      socialLinks: {
        facebook: 'https://facebook.com/mai.gom.su',
        instagram: 'https://instagram.com/mai_gom_su_bat_trang',
        youtube: 'https://youtube.com/c/maigomsuvn',
      },
    },
    {
      userId: '22222222-2222-2222-2222-222222222222',
      location: 'Huế, Thừa Thiên Huế',
      dateOfBirth: new Date('1978-07-20'),
      gender: 'male',
      socialLinks: {
        facebook: 'https://facebook.com/long.tre.hue',
        instagram: 'https://instagram.com/tre_hue_handmade',
      },
    },
    {
      userId: '33333333-3333-3333-3333-333333333333',
      location: 'Hà Nội, Việt Nam',
      dateOfBirth: new Date('1980-11-08'),
      gender: 'female',
      socialLinks: {
        facebook: 'https://facebook.com/hong.theu.dong',
        instagram: 'https://instagram.com/theu_dong_viet_nam',
      },
    },
    {
      userId: '44444444-4444-4444-4444-444444444444',
      location: 'Hội An, Quảng Nam',
      dateOfBirth: new Date('1975-12-03'),
      gender: 'male',
      socialLinks: {
        facebook: 'https://facebook.com/duc.moc.hoi.an',
        website: 'https://kim-bong-wood.com',
      },
    },
  ];

  for (const profileData of profilesData) {
    await prisma.profile.create({
      data: profileData,
    });
  }

  // Customer Profiles
  const customerProfilesData = [
    {
      userId: '55555555-5555-5555-5555-555555555555',
      location: 'Quận 1, TP.HCM',
      dateOfBirth: new Date('1995-05-10'),
      gender: 'female',
    },
    {
      userId: '66666666-6666-6666-6666-666666666666',
      location: 'Cầu Giấy, Hà Nội',
      dateOfBirth: new Date('1990-08-25'),
      gender: 'male',
    },
    {
      userId: '77777777-7777-7777-7777-777777777777',
      location: 'Quận 3, TP.HCM',
      dateOfBirth: new Date('1988-02-14'),
      gender: 'female',
    },
  ];

  for (const profileData of customerProfilesData) {
    await prisma.profile.create({
      data: profileData,
    });
  }

  // Addresses
  const addressesData = [
    {
      profileId: '11111111-1111-1111-1111-111111111111',
      fullName: 'Nguyễn Thị Mai',
      phone: '+84987654321',
      street: 'Số 123, Làng gốm Bát Tràng',
      city: 'Gia Lâm',
      state: 'Hà Nội',
      zipCode: '100000',
      country: 'Việt Nam',
      isDefault: true,
    },
    {
      profileId: '55555555-5555-5555-5555-555555555555',
      fullName: 'Nguyễn Thúy Linh',
      phone: '+84945678901',
      street: '456 Nguyễn Huệ',
      city: 'TP.HCM',
      state: 'TP.HCM',
      zipCode: '700000',
      country: 'Việt Nam',
      isDefault: true,
    },
  ];

  for (const addressData of addressesData) {
    const profile = await prisma.profile.findFirst({
      where: { userId: addressData.profileId },
    });

    if (profile) {
      await prisma.address.create({
        data: {
          ...addressData,
          profileId: profile.id,
        },
      });
    }
  }

  // =====================================================
  // 3. ARTISAN PROFILES
  // =====================================================

  const artisanProfilesData = [
    {
      userId: '11111111-1111-1111-1111-111111111111',
      shopName: 'Gốm Sứ Mai Bát Tràng',
      shopDescription:
        'Cửa hàng chuyên sản xuất và kinh doanh các sản phẩm gốm sứ truyền thống Bát Tràng. Với hơn 15 năm kinh nghiệm, chúng tôi tự hào mang đến những sản phẩm chất lượng cao, tinh xảo và mang đậm nét văn hóa Việt Nam.',
      shopLogoUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/shops/mai-gom-su-logo.jpg',
      shopBannerUrl:
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/shops/mai-gom-su-banner.jpg',
      specialties: ['Gốm sứ', 'Đồ trang trí', 'Đồ gia dụng', 'Nghệ thuật'],
      experience: 15,
      website: 'https://mai-gom-su.vn',
      contactEmail: 'mai.gom.su@gmail.com',
      contactPhone: '+84987654321',
      socialMedia: {
        facebook: 'https://facebook.com/mai.gom.su',
        instagram: 'https://instagram.com/mai_gom_su_bat_trang',
        youtube: 'https://youtube.com/c/maigomsuvn',
      },
      businessAddress: 'Làng gốm Bát Tràng, Gia Lâm, Hà Nội',
      businessHours: {
        monday: '8:00-18:00',
        tuesday: '8:00-18:00',
        wednesday: '8:00-18:00',
        thursday: '8:00-18:00',
        friday: '8:00-18:00',
        saturday: '8:00-19:00',
        sunday: '9:00-17:00',
      },
      shippingInfo: {
        freeShipping: 'Miễn phí vận chuyển đơn hàng trên 500.000đ',
        regions: ['Toàn quốc'],
        estimatedTime: '3-7 ngày',
      },
      returnPolicy: 'Chấp nhận đổi trả trong vòng 7 ngày nếu sản phẩm bị lỗi từ nhà sản xuất.',
      isVerified: true,
      rating: 4.8,
      reviewCount: 247,
      totalSales: 89500000.0,
    },
    {
      userId: '22222222-2222-2222-2222-222222222222',
      shopName: 'Tre Nứa Huế Truyền Thống',
      shopDescription:
        'Chuyên sản xuất các sản phẩm thủ công từ tre nứa theo phong cách truyền thống Huế. Các sản phẩm của chúng tôi hoàn toàn thân thiện với môi trường và được làm thủ công 100%.',
      shopLogoUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/shops/tre-hue-logo.jpg',
      shopBannerUrl:
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/shops/tre-hue-banner.jpg',
      specialties: ['Tre nứa', 'Đồ gia dụng', 'Trang trí', 'Thủ công mỹ nghệ'],
      experience: 12,
      contactEmail: 'long.tre.hue@gmail.com',
      contactPhone: '+84912345678',
      socialMedia: {
        facebook: 'https://facebook.com/long.tre.hue',
        instagram: 'https://instagram.com/tre_hue_handmade',
      },
      businessAddress: 'Phường Thuận Thành, TP. Huế, Thừa Thiên Huế',
      shippingInfo: {
        regions: ['Miền Trung', 'Miền Nam'],
        estimatedTime: '5-10 ngày',
      },
      returnPolicy: 'Đổi trả trong vòng 5 ngày nếu sản phẩm không đúng mô tả.',
      isVerified: true,
      rating: 4.6,
      reviewCount: 156,
      totalSales: 42300000.0,
    },
    {
      userId: '33333333-3333-3333-3333-333333333333',
      shopName: 'Thêu Đồng Việt Nam',
      shopDescription:
        'Chuyên thêu đồng truyền thống với các mẫu tranh, áo dài, và sản phẩm thời trang cao cấp. Mỗi sản phẩm đều được thêu tay tinh xảo với nhiều năm kinh nghiệm.',
      shopLogoUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/shops/theu-dong-logo.jpg',
      shopBannerUrl:
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/shops/theu-dong-banner.jpg',
      specialties: ['Thêu đồng', 'Áo dài', 'Tranh thêu', 'Thời trang'],
      experience: 20,
      contactEmail: 'hong.theu.dong@gmail.com',
      contactPhone: '+84923456789',
      socialMedia: {
        facebook: 'https://facebook.com/hong.theu.dong',
        instagram: 'https://instagram.com/theu_dong_viet_nam',
      },
      businessAddress: 'Số 789, Phố cổ Hà Nội',
      shippingInfo: {
        freeShipping: 'Miễn phí vận chuyển toàn quốc đơn hàng trên 1.000.000đ',
        regions: ['Toàn quốc'],
        estimatedTime: '7-14 ngày',
      },
      returnPolicy: 'Không chấp nhận đổi trả do sản phẩm may đo theo yêu cầu.',
      isVerified: false,
      rating: 4.9,
      reviewCount: 89,
      totalSales: 156700000.0,
    },
    {
      userId: '44444444-4444-4444-4444-444444444444',
      shopName: 'Mộc Kim Bồng Hội An',
      shopDescription:
        'Làng mộc Kim Bồng truyền thống với nghề chế tác đồ gỗ hơn 400 năm lịch sử. Chúng tôi chuyên sản xuất nội thất, đồ thờ và nghệ thuật từ gỗ quý.',
      shopLogoUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/shops/kim-bong-logo.jpg',
      shopBannerUrl:
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/shops/kim-bong-banner.jpg',
      specialties: ['Mộc', 'Nội thất', 'Đồ thờ', 'Nghệ thuật gỗ'],
      experience: 25,
      website: 'https://kim-bong-wood.com',
      contactEmail: 'duc.moc.hoi.an@gmail.com',
      contactPhone: '+84934567890',
      socialMedia: {
        facebook: 'https://facebook.com/duc.moc.hoi.an',
        website: 'https://kim-bong-wood.com',
      },
      businessAddress: 'Làng mộc Kim Bồng, Hội An, Quảng Nam',
      shippingInfo: {
        regions: ['Toàn quốc', 'Quốc tế'],
        estimatedTime: '10-20 ngày',
      },
      returnPolicy: 'Bảo hành 1 năm cho sản phẩm nội thất.',
      isVerified: true,
      rating: 4.7,
      reviewCount: 312,
      totalSales: 275600000.0,
    },
  ];

  for (const artisanProfileData of artisanProfilesData) {
    await prisma.artisanProfile.create({
      data: artisanProfileData,
    });
  }

  // =====================================================
  // 4. CATEGORIES & ATTRIBUTE TEMPLATES
  // =====================================================

  const categoriesData = [
    {
      id: 'cat-gom-su',
      name: 'Gốm Sứ',
      slug: 'gom-su',
      description: 'Các sản phẩm gốm sứ truyền thống và hiện đại',
      imageUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/categories/gom-su.jpg',
      level: 0,
      sortOrder: 1,
      isActive: true,
    },
    {
      id: 'cat-tre-nua',
      name: 'Tre Nứa',
      slug: 'tre-nua',
      description: 'Sản phẩm thủ công từ tre nứa thân thiện môi trường',
      imageUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/categories/tre-nua.jpg',
      level: 0,
      sortOrder: 2,
      isActive: true,
    },
    {
      id: 'cat-theu-dong',
      name: 'Thêu Đồng',
      slug: 'theu-dong',
      description: 'Nghệ thuật thêu đồng truyền thống Việt Nam',
      imageUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/categories/theu-dong.jpg',
      level: 0,
      sortOrder: 3,
      isActive: true,
    },
    {
      id: 'cat-do-go',
      name: 'Đồ Gỗ',
      slug: 'do-go',
      description: 'Sản phẩm từ gỗ: nội thất, trang trí, nghệ thuật',
      imageUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/categories/do-go.jpg',
      level: 0,
      sortOrder: 4,
      isActive: true,
    },
    {
      id: 'cat-trang-tri',
      name: 'Trang Trí',
      slug: 'trang-tri',
      description: 'Đồ trang trí nội thất thủ công',
      imageUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/categories/trang-tri.jpg',
      level: 0,
      sortOrder: 5,
      isActive: true,
    },
  ];

  for (const categoryData of categoriesData) {
    await prisma.category.create({
      data: categoryData,
    });
  }

  // Category Attribute Templates
  const attributeTemplatesData = [
    // Gốm Sứ
    {
      categoryId: 'cat-gom-su',
      name: 'Chất liệu',
      key: 'material',
      type: 'SELECT' as AttributeType,
      isRequired: true,
      isVariant: false,
      options: ['Sứ', 'Gốm', 'Ceramic', 'Porcelain'],
      description: 'Chất liệu chính của sản phẩm',
    },
    {
      categoryId: 'cat-gom-su',
      name: 'Kích thước',
      key: 'size',
      type: 'SELECT' as AttributeType,
      isRequired: true,
      isVariant: true,
      options: ['Nhỏ', 'Vừa', 'Lớn', 'Rất lớn'],
      description: 'Kích thước sản phẩm',
    },
    {
      categoryId: 'cat-gom-su',
      name: 'Màu sắc',
      key: 'color',
      type: 'SELECT' as AttributeType,
      isRequired: false,
      isVariant: true,
      options: ['Trắng', 'Xanh', 'Nâu', 'Đỏ', 'Vàng', 'Đa màu'],
      description: 'Màu sắc chủ đạo',
    },
    // Tre Nứa
    {
      categoryId: 'cat-tre-nua',
      name: 'Loại tre',
      key: 'bamboo_type',
      type: 'SELECT' as AttributeType,
      isRequired: true,
      isVariant: false,
      options: ['Tre tam', 'Tre gai', 'Tre nứa', 'Tre luồng'],
      description: 'Loại tre được sử dụng',
    },
    {
      categoryId: 'cat-tre-nua',
      name: 'Kích cỡ',
      key: 'size',
      type: 'SELECT' as AttributeType,
      isRequired: true,
      isVariant: true,
      options: ['Nhỏ (< 20cm)', 'Vừa (20-40cm)', 'Lớn (40-60cm)', 'Rất lớn (> 60cm)'],
      description: 'Kích cỡ sản phẩm',
    },
  ];

  for (const templateData of attributeTemplatesData) {
    await prisma.categoryAttributeTemplate.create({
      data: templateData,
    });
  }

  // =====================================================
  // 5. PRODUCTS & VARIANTS
  // =====================================================

  const productsData = [
    // Sản phẩm của Mai - Gốm Sứ
    {
      id: 'prod-binh-hoa-bat-trang',
      sellerId: '11111111-1111-1111-1111-111111111111',
      name: 'Bình Hoa Gốm Sứ Bát Tràng Cổ Điển',
      slug: 'binh-hoa-gom-su-bat-trang-co-dien',
      description:
        'Bình hoa gốm sứ Bát Tràng được làm thủ công hoàn toàn với họa tiết cổ điển. Sản phẩm có độ bền cao, thích hợp trang trí phòng khách, phòng làm việc hoặc làm quà tặng ý nghĩa.',
      categoryIds: ['cat-gom-su', 'cat-trang-tri'],
      price: 450000.0,
      discountPrice: 380000.0,
      quantity: 25,
      minOrderQty: 1,
      maxOrderQty: 5,
      sku: 'BH-BT-001',
      weight: 1.2,
      dimensions: {
        length: 15,
        width: 15,
        height: 25,
        unit: 'cm',
      },
      isCustomizable: true,
      allowNegotiation: true,
      shippingInfo: {
        weight: 1.2,
        fragile: true,
        specialHandling: 'Cẩn thận với hàng dễ vỡ',
      },
      status: 'PUBLISHED' as ProductStatus,
      tags: ['bình hoa', 'gốm sứ', 'bát tràng', 'trang trí', 'quà tặng'],
      images: [
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/binh-hoa-1.jpg',
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/binh-hoa-2.jpg',
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/binh-hoa-3.jpg',
      ],
      featuredImage: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/binh-hoa-1.jpg',
      seoTitle: 'Bình Hoa Gốm Sứ Bát Tràng Cổ Điển - Thủ Công Truyền Thống',
      seoDescription:
        'Bình hoa gốm sứ Bát Tràng làm thủ công, họa tiết cổ điển, phù hợp trang trí và làm quà tặng. Giá tốt nhất thị trường.',
      attributes: {
        material: 'Sứ',
        pattern: 'Hoa sen',
        origin: 'Bát Tràng',
        technique: 'Thủ công',
      },
      specifications: {
        capacity: '500ml',
        dishwasher_safe: true,
        microwave_safe: false,
      },
      hasVariants: true,
      viewCount: 1247,
      salesCount: 67,
      avgRating: 4.8,
      reviewCount: 23,
    },
    {
      id: 'prod-am-tra-su',
      sellerId: '11111111-1111-1111-1111-111111111111',
      name: 'Ấm Trà Sứ Trắng Cao Cấp',
      slug: 'am-tra-su-trang-cao-cap',
      description:
        'Ấm trà sứ trắng tinh khôi, thiết kế đơn giản nhưng sang trọng. Phù hợp cho gia đình và văn phòng.',
      categoryIds: ['cat-gom-su'],
      price: 320000.0,
      quantity: 15,
      sku: 'AT-ST-002',
      weight: 0.8,
      isCustomizable: false,
      allowNegotiation: true,
      status: 'PUBLISHED' as ProductStatus,
      tags: ['ấm trà', 'sứ trắng', 'bát tràng'],
      images: [
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/am-tra-1.jpg',
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/am-tra-2.jpg',
      ],
      featuredImage: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/am-tra-1.jpg',
      attributes: {
        material: 'Sứ',
        color: 'Trắng',
        capacity: '600ml',
      },
      hasVariants: false,
      viewCount: 892,
      salesCount: 34,
      avgRating: 4.6,
      reviewCount: 12,
    },

    // Sản phẩm của Long - Tre Nứa
    {
      id: 'prod-gio-tre-hue',
      sellerId: '22222222-2222-2222-2222-222222222222',
      name: 'Giỏ Tre Huế Truyền Thống',
      slug: 'gio-tre-hue-truyen-thong',
      description:
        'Giỏ tre được đan thủ công theo phong cách truyền thống Huế. Sản phẩm thân thiện môi trường, bền đẹp và tiện dụng.',
      categoryIds: ['cat-tre-nua'],
      price: 180000.0,
      discountPrice: 150000.0,
      quantity: 30,
      sku: 'GT-HUE-001',
      weight: 0.5,
      dimensions: {
        length: 30,
        width: 25,
        height: 15,
        unit: 'cm',
      },
      isCustomizable: true,
      allowNegotiation: true,
      status: 'PUBLISHED' as ProductStatus,
      tags: ['giỏ tre', 'huế', 'thủ công', 'môi trường'],
      images: [
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/gio-tre-1.jpg',
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/gio-tre-2.jpg',
      ],
      featuredImage: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/gio-tre-1.jpg',
      attributes: {
        bamboo_type: 'Tre nứa',
        pattern: 'Đan chéo',
        eco_friendly: true,
      },
      hasVariants: true,
      viewCount: 675,
      salesCount: 45,
      avgRating: 4.5,
      reviewCount: 18,
    },

    // Sản phẩm của Hồng - Thêu Đồng
    {
      id: 'prod-tranh-theu-dong',
      sellerId: '33333333-3333-3333-3333-333333333333',
      name: 'Tranh Thêu Đồng Hoa Sen',
      slug: 'tranh-theu-dong-hoa-sen',
      description:
        'Tranh thêu đồng với họa tiết hoa sen tinh xảo, được thêu tay hoàn toàn. Thích hợp trang trí phòng khách, phòng làm việc.',
      categoryIds: ['cat-theu-dong', 'cat-trang-tri'],
      price: 1200000.0,
      discountPrice: 1000000.0,
      quantity: 8,
      sku: 'TTD-HS-001',
      weight: 0.3,
      isCustomizable: true,
      allowNegotiation: false,
      status: 'PUBLISHED' as ProductStatus,
      tags: ['tranh thêu', 'thêu đồng', 'hoa sen', 'nghệ thuật'],
      images: [
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/tranh-theu-1.jpg',
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/tranh-theu-2.jpg',
      ],
      featuredImage:
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/tranh-theu-1.jpg',
      attributes: {
        pattern: 'Hoa sen',
        technique: 'Thêu tay',
        frame_included: true,
      },
      hasVariants: false,
      viewCount: 543,
      salesCount: 12,
      avgRating: 4.9,
      reviewCount: 8,
    },

    // Sản phẩm của Đức - Đồ Gỗ
    {
      id: 'prod-ban-tra-go',
      sellerId: '44444444-4444-4444-4444-444444444444',
      name: 'Bàn Trà Gỗ Hương Kim Bồng',
      slug: 'ban-tra-go-huong-kim-bong',
      description:
        'Bàn trà được chế tác từ gỗ hương nguyên khối theo kỹ thuật truyền thống làng mộc Kim Bồng. Thiết kế tinh xảo với họa tiết chạm khắc thủ công.',
      categoryIds: ['cat-do-go'],
      price: 3500000.0,
      quantity: 5,
      sku: 'BT-GH-001',
      weight: 15.0,
      dimensions: {
        length: 80,
        width: 50,
        height: 40,
        unit: 'cm',
      },
      isCustomizable: true,
      allowNegotiation: true,
      status: 'PUBLISHED' as ProductStatus,
      tags: ['bàn trà', 'gỗ hương', 'kim bồng', 'nội thất'],
      images: [
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/ban-tra-1.jpg',
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/ban-tra-2.jpg',
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/ban-tra-3.jpg',
      ],
      featuredImage: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/ban-tra-1.jpg',
      attributes: {
        wood_type: 'Gỗ hương',
        technique: 'Chạm khắc thủ công',
        finish: 'Sơn PU bóng',
      },
      hasVariants: false,
      viewCount: 234,
      salesCount: 3,
      avgRating: 5.0,
      reviewCount: 2,
    },
  ];

  for (const productData of productsData) {
    await prisma.product.create({
      data: productData,
    });
  }

  // Product Variants
  const variantsData = [
    // Variants cho bình hoa
    {
      productId: 'prod-binh-hoa-bat-trang',
      sku: 'BH-BT-001-S',
      name: 'Bình Hoa Nhỏ - Xanh',
      price: 380000.0,
      discountPrice: 320000.0,
      quantity: 8,
      images: ['https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/binh-hoa-s-xanh.jpg'],
      attributes: {
        size: 'Nhỏ',
        color: 'Xanh',
      },
      isDefault: true,
    },
    {
      productId: 'prod-binh-hoa-bat-trang',
      sku: 'BH-BT-001-M',
      name: 'Bình Hoa Vừa - Trắng',
      price: 450000.0,
      discountPrice: 380000.0,
      quantity: 10,
      images: [
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/binh-hoa-m-trang.jpg',
      ],
      attributes: {
        size: 'Vừa',
        color: 'Trắng',
      },
    },
    {
      productId: 'prod-binh-hoa-bat-trang',
      sku: 'BH-BT-001-L',
      name: 'Bình Hoa Lớn - Nâu',
      price: 520000.0,
      discountPrice: 450000.0,
      quantity: 7,
      images: ['https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/binh-hoa-l-nau.jpg'],
      attributes: {
        size: 'Lớn',
        color: 'Nâu',
      },
    },

    // Variants cho giỏ tre
    {
      productId: 'prod-gio-tre-hue',
      sku: 'GT-HUE-001-S',
      name: 'Giỏ Tre Nhỏ',
      price: 150000.0,
      discountPrice: 120000.0,
      quantity: 15,
      attributes: {
        size: 'Nhỏ (< 20cm)',
      },
      isDefault: true,
    },
    {
      productId: 'prod-gio-tre-hue',
      sku: 'GT-HUE-001-M',
      name: 'Giỏ Tre Vừa',
      price: 180000.0,
      discountPrice: 150000.0,
      quantity: 10,
      attributes: {
        size: 'Vừa (20-40cm)',
      },
    },
    {
      productId: 'prod-gio-tre-hue',
      sku: 'GT-HUE-001-L',
      name: 'Giỏ Tre Lớn',
      price: 220000.0,
      discountPrice: 180000.0,
      quantity: 5,
      attributes: {
        size: 'Lớn (40-60cm)',
      },
    },
  ];

  for (const variantData of variantsData) {
    await prisma.productVariant.create({
      data: variantData,
    });
  }

  // Price History
  const priceHistoryData = [
    {
      productId: 'prod-binh-hoa-bat-trang',
      price: 500000.0,
      changeNote: 'Giá gốc khi ra mắt sản phẩm',
      changedBy: '11111111-1111-1111-1111-111111111111',
      createdAt: new Date('2024-01-15'),
    },
    {
      productId: 'prod-binh-hoa-bat-trang',
      price: 450000.0,
      changeNote: 'Giảm giá để tăng tính cạnh tranh',
      changedBy: '11111111-1111-1111-1111-111111111111',
      createdAt: new Date('2024-02-20'),
    },
  ];

  for (const historyData of priceHistoryData) {
    await prisma.priceHistory.create({
      data: historyData,
    });
  }

  // =====================================================
  // 6. SOCIAL - FOLLOWS, POSTS, COMMENTS, LIKES
  // =====================================================

  // Follows - Customers follow Artisans
  const followsData = [
    {
      followerId: '55555555-5555-5555-5555-555555555555', // Linh
      followingId: '11111111-1111-1111-1111-111111111111', // Mai
      notifyNewPosts: true,
    },
    {
      followerId: '55555555-5555-5555-5555-555555555555', // Linh
      followingId: '22222222-2222-2222-2222-222222222222', // Long
      notifyNewPosts: true,
    },
    {
      followerId: '66666666-6666-6666-6666-666666666666', // Minh
      followingId: '11111111-1111-1111-1111-111111111111', // Mai
      notifyNewPosts: false,
    },
    {
      followerId: '66666666-6666-6666-6666-666666666666', // Minh
      followingId: '33333333-3333-3333-3333-333333333333', // Hồng
      notifyNewPosts: true,
    },
    {
      followerId: '77777777-7777-7777-7777-777777777777', // Thu
      followingId: '44444444-4444-4444-4444-444444444444', // Đức
      notifyNewPosts: true,
    },
  ];

  for (const followData of followsData) {
    await prisma.follow.create({
      data: followData,
    });
  }

  // Posts - Only Artisans can post
  const postsData = [
    {
      id: 'post-mai-quy-trinh',
      userId: '11111111-1111-1111-1111-111111111111', // Mai
      title: 'Quy Trình Tạo Ra Một Chiếc Bình Hoa Gốm Sứ Bát Tràng',
      slug: 'quy-trinh-tao-ra-binh-hoa-gom-su-bat-trang',
      summary:
        'Hành trình từ đất sét đến một tác phẩm nghệ thuật qua đôi bàn tay khéo léo của nghệ nhân.',
      content: {
        blocks: [
          {
            id: 'block1',
            type: 'paragraph',
            data: {
              text: 'Chào các bạn! Hôm nay mình sẽ chia sẻ quy trình tạo ra một chiếc bình hoa gốm sứ từ A đến Z tại làng gốm Bát Tràng.',
            },
          },
          {
            id: 'block2',
            type: 'image',
            data: {
              url: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/posts/quy-trinh-1.jpg',
              caption: 'Khâu chuẩn bị đất sét',
            },
          },
          {
            id: 'block3',
            type: 'paragraph',
            data: {
              text: 'Đầu tiên là khâu chuẩn bị đất sét. Chúng tôi sử dụng đất sét từ sông Hồng, được ủ kỹ để đạt độ dẻo tốt nhất.',
            },
          },
        ],
      },
      contentText:
        'Chào các bạn! Hôm nay mình sẽ chia sẻ quy trình tạo ra một chiếc bình hoa gốm sứ từ A đến Z tại làng gốm Bát Tràng. Đầu tiên là khâu chuẩn bị đất sét...',
      type: 'TUTORIAL' as PostType,
      status: 'PUBLISHED' as PostStatus,
      thumbnailUrl:
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/posts/quy-trinh-thumb.jpg',
      coverImage: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/posts/quy-trinh-cover.jpg',
      mediaUrls: [
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/posts/quy-trinh-1.jpg',
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/posts/quy-trinh-2.jpg',
      ],
      tags: ['tutorial', 'gốm sứ', 'bát tràng', 'quy trình'],
      mentionedProducts: [
        {
          productId: 'prod-binh-hoa-bat-trang',
          contextText: 'bình hoa như thế này',
          position: 150,
        },
      ],
      viewCount: 2341,
      likeCount: 89,
      commentCount: 23,
      shareCount: 12,
      publishedAt: new Date('2024-11-01'),
    },
    {
      id: 'post-long-tre-thien-nhien',
      userId: '22222222-2222-2222-2222-222222222222', // Long
      title: 'Tre Nứa - Vật Liệu Xanh Của Tương Lai',
      slug: 'tre-nua-vat-lieu-xanh-cua-tuong-lai',
      summary:
        'Tại sao tre nứa lại được coi là vật liệu thân thiện với môi trường và bền vững cho tương lai.',
      content: {
        blocks: [
          {
            id: 'block1',
            type: 'paragraph',
            data: {
              text: 'Trong bối cảnh biến đổi khí hậu ngày càng nghiêm trọng, việc sử dụng vật liệu thân thiện với môi trường trở nên quan trọng hơn bao giờ hết.',
            },
          },
        ],
      },
      contentText:
        'Trong bối cảnh biến đổi khí hậu ngày càng nghiêm trọng, việc sử dụng vật liệu thân thiện với môi trường...',
      type: 'STORY' as PostType,
      status: 'PUBLISHED' as PostStatus,
      thumbnailUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/posts/tre-xanh-thumb.jpg',
      tags: ['môi trường', 'tre nứa', 'bền vững'],
      mentionedProducts: [
        {
          productId: 'prod-gio-tre-hue',
          contextText: 'giỏ tre như này',
          position: 120,
        },
      ],
      viewCount: 1567,
      likeCount: 67,
      commentCount: 15,
      shareCount: 8,
      publishedAt: new Date('2024-11-15'),
    },
    {
      id: 'post-hong-theu-ao-dai',
      userId: '33333333-3333-3333-3333-333333333333', // Hồng
      title: 'Nghệ Thuật Thêu Đồng Trên Áo Dài Việt Nam',
      slug: 'nghe-thuat-theu-dong-tren-ao-dai-viet-nam',
      summary:
        'Khám phá vẻ đẹp tinh xảo của nghệ thuật thêu đồng truyền thống trên trang phục áo dài.',
      content: {
        blocks: [
          {
            id: 'block1',
            type: 'paragraph',
            data: {
              text: 'Áo dài không chỉ là trang phục truyền thống mà còn là canvas để thể hiện nghệ thuật thêu đồng tinh xảo.',
            },
          },
        ],
      },
      contentText:
        'Áo dài không chỉ là trang phục truyền thống mà còn là canvas để thể hiện nghệ thuật thêu đồng tinh xảo...',
      type: 'PRODUCT_SHOWCASE' as PostType,
      status: 'PUBLISHED' as PostStatus,
      thumbnailUrl:
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/posts/ao-dai-theu-thumb.jpg',
      tags: ['áo dài', 'thêu đồng', 'truyền thống'],
      viewCount: 987,
      likeCount: 45,
      commentCount: 8,
      shareCount: 6,
      publishedAt: new Date('2024-11-20'),
    },
  ];

  for (const postData of postsData) {
    await prisma.post.create({
      data: postData,
    });
  }

  // Comments
  const commentsData = [
    {
      postId: 'post-mai-quy-trinh',
      userId: '55555555-5555-5555-5555-555555555555', // Linh
      content:
        'Wow, quy trình rất phức tạp nhưng thành quả thật tuyệt vời! Mình rất thích những sản phẩm thủ công như vậy.',
      likeCount: 5,
    },
    {
      postId: 'post-mai-quy-trinh',
      userId: '66666666-6666-6666-6666-666666666666', // Minh
      content:
        'Cảm ơn chị đã chia sẻ. Mình đang có ý định mua một chiếc bình hoa để trang trí nhà.',
      likeCount: 3,
    },
    {
      postId: 'post-long-tre-thien-nhien',
      userId: '77777777-7777-7777-7777-777777777777', // Thu
      content: 'Rất ý nghĩa! Chúng ta cần sử dụng nhiều sản phẩm thân thiện với môi trường hơn.',
      likeCount: 8,
    },
  ];

  for (const commentData of commentsData) {
    await prisma.comment.create({
      data: commentData,
    });
  }

  // Likes
  const likesData = [
    // Likes cho posts
    {
      userId: '55555555-5555-5555-5555-555555555555',
      postId: 'post-mai-quy-trinh',
      reaction: 'like',
    },
    {
      userId: '66666666-6666-6666-6666-666666666666',
      postId: 'post-mai-quy-trinh',
      reaction: 'love',
    },
    {
      userId: '77777777-7777-7777-7777-777777777777',
      postId: 'post-long-tre-thien-nhien',
      reaction: 'like',
    },
  ];

  for (const likeData of likesData) {
    await prisma.like.create({
      data: likeData,
    });
  }

  // =====================================================
  // 7. NEGOTIATIONS & QUOTES
  // =====================================================

  // Price Negotiations
  const negotiationsData = [
    {
      productId: 'prod-binh-hoa-bat-trang',
      customerId: '55555555-5555-5555-5555-555555555555', // Linh
      artisanId: '11111111-1111-1111-1111-111111111111', // Mai
      originalPrice: 450000.0,
      proposedPrice: 400000.0,
      quantity: 2,
      customerReason:
        'Em mua 2 cái nên anh chị có thể giảm giá được không ạ? Em rất thích sản phẩm này.',
      status: 'PENDING' as NegotiationStatus,
      negotiationHistory: [
        {
          timestamp: '2024-12-01T10:00:00Z',
          actor: 'customer',
          action: 'PROPOSE',
          price: 400000.0,
          message: 'Em mua 2 cái nên anh chị có thể giảm giá được không ạ?',
        },
      ],
      expiresAt: new Date('2024-12-08'),
    },
    {
      productId: 'prod-ban-tra-go',
      customerId: '66666666-6666-6666-6666-666666666666', // Minh
      artisanId: '44444444-4444-4444-4444-444444444444', // Đức
      originalPrice: 3500000.0,
      proposedPrice: 3200000.0,
      quantity: 1,
      customerReason:
        'Anh ơi, em thấy bàn rất đẹp nhưng giá hơi cao so với budget em. Anh có thể thương lượng được không?',
      status: 'COUNTER_OFFERED' as NegotiationStatus,
      artisanResponse:
        'Cảm ơn anh đã quan tâm sản phẩm. Do đây là gỗ hương nguyên khối nên giá khó giảm được nhiều. Anh có thể chấp nhận 3.300.000đ được không?',
      finalPrice: 3300000.0,
      negotiationHistory: [
        {
          timestamp: '2024-11-25T14:00:00Z',
          actor: 'customer',
          action: 'PROPOSE',
          price: 3200000.0,
          message: 'Anh ơi, em thấy bàn rất đẹp nhưng giá hơi cao so với budget em.',
        },
        {
          timestamp: '2024-11-26T09:30:00Z',
          actor: 'artisan',
          action: 'COUNTER',
          price: 3300000.0,
          message: 'Do đây là gỗ hương nguyên khối nên giá khó giảm được nhiều.',
        },
      ],
      expiresAt: new Date('2024-12-10'),
    },
  ];

  for (const negotiationData of negotiationsData) {
    await prisma.priceNegotiation.create({
      data: negotiationData,
    });
  }

  // Quote Requests (Custom Orders)
  const quotesData = [
    {
      customerId: '77777777-7777-7777-7777-777777777777', // Thu
      artisanId: '33333333-3333-3333-3333-333333333333', // Hồng
      title: 'Áo Dài Thêu Hoa Mai Theo Yêu Cầu',
      description:
        'Em muốn đặt may một chiếc áo dài thêu hoa mai màu vàng trên nền đỏ đô. Size M, dáng truyền thống nhưng ôm vừa phải.',
      referenceProductId: 'prod-tranh-theu-dong',
      specifications: {
        size: 'M',
        color: 'Đỏ đô',
        pattern: 'Hoa mai vàng',
        style: 'Truyền thống ôm vừa',
        deadline: '2 tuần',
      },
      attachmentUrls: [
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/quotes/ao-dai-ref-1.jpg',
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/quotes/ao-dai-ref-2.jpg',
      ],
      estimatedPrice: 2500000.0,
      customerBudget: 2000000.0,
      timeline: '2 tuần',
      status: 'PENDING' as QuoteStatus,
      negotiationHistory: [
        {
          timestamp: '2024-11-28T16:00:00Z',
          actor: 'customer',
          action: 'REQUEST',
          details: 'Gửi yêu cầu custom áo dài thêu hoa mai',
        },
      ],
      expiresAt: new Date('2024-12-15'),
    },
    {
      customerId: '55555555-5555-5555-5555-555555555555', // Linh
      artisanId: '22222222-2222-2222-2222-222222222222', // Long
      title: 'Bộ Đồ Ăn Tre Nứa Cho Gia Đình',
      description:
        'Anh ơi, nhà em muốn đặt một bộ đồ ăn từ tre nứa gồm: 6 bát, 6 đôi đũa, 1 khay lớn, 2 khay nhỏ. Thiết kế đơn giản, màu tre tự nhiên.',
      specifications: {
        items: ['6 bát tre', '6 đôi đũa', '1 khay lớn', '2 khay nhỏ'],
        material: 'Tre nứa tự nhiên',
        finish: 'Mài nhẵn, dầu tự nhiên',
        packaging: 'Hộp gỗ đựng',
      },
      attachmentUrls: [
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/quotes/bo-do-an-tre.jpg',
      ],
      customerBudget: 800000.0,
      timeline: '10 ngày',
      status: 'ACCEPTED' as QuoteStatus,
      artisanResponse: {
        acceptedPrice: 900000.0,
        estimatedCompletion: '12 ngày',
        message:
          'Cảm ơn chị đã tin tưởng. Em có thể làm bộ đồ ăn này với giá 900k, thời gian hoàn thành 12 ngày.',
        specifications: {
          wood_treatment: 'Ngâm nước muối, phơi khô tự nhiên',
          warranty: '6 tháng',
        },
      },
      finalPrice: 900000.0,
      negotiationHistory: [
        {
          timestamp: '2024-11-20T10:00:00Z',
          actor: 'customer',
          action: 'REQUEST',
          details: 'Gửi yêu cầu custom bộ đồ ăn tre',
        },
        {
          timestamp: '2024-11-22T14:30:00Z',
          actor: 'artisan',
          action: 'ACCEPT',
          details: 'Chấp nhận với giá 900k, thời gian 12 ngày',
        },
      ],
    },
  ];

  for (const quoteData of quotesData) {
    await prisma.quoteRequest.create({
      data: quoteData,
    });
  }

  // =====================================================
  // 8. CART & ORDERS
  // =====================================================

  // Cart Items
  const cartItemsData = [
    {
      userId: '55555555-5555-5555-5555-555555555555', // Linh
      productId: 'prod-binh-hoa-bat-trang',
      variantId: 'BH-BT-001-M', // Sẽ được resolve sau
      quantity: 1,
      price: 380000.0,
    },
    {
      userId: '55555555-5555-5555-5555-555555555555', // Linh
      productId: 'prod-gio-tre-hue',
      variantId: 'GT-HUE-001-S', // Sẽ được resolve sau
      quantity: 2,
      price: 120000.0,
    },
    {
      userId: '66666666-6666-6666-6666-666666666666', // Minh
      productId: 'prod-tranh-theu-dong',
      quantity: 1,
      price: 1000000.0,
    },
  ];

  // Resolve variant IDs first
  const variants = await prisma.productVariant.findMany({
    select: { id: true, sku: true },
  });

  const variantMap = new Map(variants.map((v) => [v.sku, v.id]));

  for (const cartData of cartItemsData) {
    if (cartData.variantId && variantMap.has(cartData.variantId)) {
      cartData.variantId = variantMap.get(cartData.variantId)!;
    } else {
      delete cartData.variantId;
    }

    await prisma.cartItem.create({
      data: cartData,
    });
  }

  // Orders
  const ordersData = [
    {
      id: 'order-001',
      orderNumber: 'AC20241201001',
      userId: '66666666-6666-6666-6666-666666666666', // Minh
      status: 'DELIVERED' as OrderStatus,
      paymentStatus: 'COMPLETED' as PaymentStatus,
      totalAmount: 350000.0,
      subtotal: 320000.0,
      shippingCost: 30000.0,
      paymentMethod: 'DIGITAL_WALLET' as PaymentMethod,
      paymentReference: 'PAY-001',
      deliveryStatus: 'DELIVERED' as DeliveryStatus,
      expectedDelivery: new Date('2024-11-25'),
      actualDelivery: new Date('2024-11-24'),
      isDeliveryLate: false,
      canReturn: true,
      returnDeadline: new Date('2024-12-01'),
      isRated: true,
      buyerSatisfaction: 5,
      notes: 'Giao hàng cẩn thận, đóng gói kỹ',
      statusHistory: [
        {
          status: 'PENDING',
          timestamp: '2024-11-20T10:00:00Z',
          note: 'Đơn hàng được tạo',
        },
        {
          status: 'CONFIRMED',
          timestamp: '2024-11-20T14:30:00Z',
          note: 'Xác nhận đơn hàng',
        },
        {
          status: 'PAID',
          timestamp: '2024-11-20T15:00:00Z',
          note: 'Thanh toán thành công',
        },
        {
          status: 'SHIPPED',
          timestamp: '2024-11-22T08:00:00Z',
          note: 'Đã giao cho đơn vị vận chuyển',
        },
        {
          status: 'DELIVERED',
          timestamp: '2024-11-24T16:30:00Z',
          note: 'Giao hàng thành công',
        },
      ],
      createdAt: new Date('2024-11-20'),
    },
    {
      id: 'order-002',
      orderNumber: 'AC20241202002',
      userId: '77777777-7777-7777-7777-777777777777', // Thu
      status: 'PROCESSING' as OrderStatus,
      paymentStatus: 'COMPLETED' as PaymentStatus,
      totalAmount: 200000.0,
      subtotal: 180000.0,
      shippingCost: 20000.0,
      paymentMethod: 'BANK_TRANSFER' as PaymentMethod,
      paymentReference: 'PAY-002',
      deliveryStatus: 'PREPARING' as DeliveryStatus,
      expectedDelivery: new Date('2024-12-08'),
      canReturn: true,
      returnDeadline: new Date('2024-12-15'),
      statusHistory: [
        {
          status: 'PENDING',
          timestamp: '2024-12-02T09:00:00Z',
          note: 'Đơn hàng được tạo',
        },
        {
          status: 'PAID',
          timestamp: '2024-12-02T11:00:00Z',
          note: 'Thanh toán thành công qua chuyển khoản',
        },
        {
          status: 'PROCESSING',
          timestamp: '2024-12-02T14:00:00Z',
          note: 'Bắt đầu chuẩn bị hàng',
        },
      ],
      createdAt: new Date('2024-12-02'),
    },
  ];

  for (const orderData of ordersData) {
    await prisma.order.create({
      data: orderData,
    });
  }

  // Order Items
  const orderItemsData = [
    {
      orderId: 'order-001',
      productId: 'prod-am-tra-su',
      sellerId: '11111111-1111-1111-1111-111111111111', // Mai
      quantity: 1,
      price: 320000.0,
    },
    {
      orderId: 'order-002',
      productId: 'prod-gio-tre-hue',
      sellerId: '22222222-2222-2222-2222-222222222222', // Long
      quantity: 1,
      price: 180000.0,
    },
  ];

  for (const orderItemData of orderItemsData) {
    await prisma.orderItem.create({
      data: orderItemData,
    });
  }

  // =====================================================
  // 9. REVIEWS
  // =====================================================

  const reviewsData = [
    {
      userId: '66666666-6666-6666-6666-666666666666', // Minh
      productId: 'prod-am-tra-su',
      rating: 5,
      title: 'Ấm trà rất đẹp và chất lượng',
      comment:
        'Mình rất hài lòng với chiếc ấm trà này. Chất lượng sứ rất tốt, thiết kế đơn giản nhưng sang trọng. Nước trà giữ nhiệt rất lâu. Đóng gói cẩn thận, giao hàng nhanh. Sẽ ủng hộ shop tiếp!',
      images: ['https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/reviews/am-tra-review-1.jpg'],
      helpfulCount: 8,
      isVerifiedPurchase: true,
    },
    {
      userId: '77777777-7777-7777-7777-777777777777', // Thu
      productId: 'prod-gio-tre-hue',
      rating: 4,
      title: 'Giỏ tre đẹp, thân thiện môi trường',
      comment:
        'Giỏ tre đan rất chắc chắn, màu sắc tự nhiên đẹp. Mình dùng để đựng trái cây rất tiện. Duy nhất là mùi tre hơi nặng lúc đầu nhưng để vài ngày là hết.',
      images: ['https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/reviews/gio-tre-review-1.jpg'],
      helpfulCount: 5,
      isVerifiedPurchase: true,
    },
    {
      userId: '55555555-5555-5555-5555-555555555555', // Linh
      productId: 'prod-binh-hoa-bat-trang',
      rating: 5,
      title: 'Tuyệt vời!',
      comment:
        'Bình hoa đẹp lắm ạ. Họa tiết tinh xảo, màu sắc hài hòa. Đặt ở phòng khách rất sang trọng.',
      helpfulCount: 3,
      isVerifiedPurchase: false,
    },
  ];

  for (const reviewData of reviewsData) {
    await prisma.review.create({
      data: reviewData,
    });
  }

  // =====================================================
  // 10. WISHLISTS
  // =====================================================

  const wishlistsData = [
    {
      userId: '55555555-5555-5555-5555-555555555555', // Linh
      itemType: 'PRODUCT' as WishlistItemType,
      productId: 'prod-tranh-theu-dong',
    },
    {
      userId: '55555555-5555-5555-5555-555555555555', // Linh
      itemType: 'POST' as WishlistItemType,
      postId: 'post-hong-theu-ao-dai',
    },
    {
      userId: '66666666-6666-6666-6666-666666666666', // Minh
      itemType: 'PRODUCT' as WishlistItemType,
      productId: 'prod-ban-tra-go',
    },
    {
      userId: '77777777-7777-7777-7777-777777777777', // Thu
      itemType: 'PRODUCT' as WishlistItemType,
      productId: 'prod-binh-hoa-bat-trang',
    },
    {
      userId: '77777777-7777-7777-7777-777777777777', // Thu
      itemType: 'POST' as WishlistItemType,
      postId: 'post-mai-quy-trinh',
    },
  ];

  for (const wishlistData of wishlistsData) {
    await prisma.wishlist.create({
      data: wishlistData,
    });
  }

  // =====================================================
  // 11. MESSAGES & NOTIFICATIONS
  // =====================================================

  // Get quote request ID trước
  const quotes = await prisma.quoteRequest.findMany({
    select: { id: true },
  });

  // Messages
  const messagesData = [
    {
      senderId: '55555555-5555-5555-5555-555555555555', // Linh
      receiverId: '11111111-1111-1111-1111-111111111111', // Mai
      content:
        'Chào chị! Em rất thích bình hoa gốm sứ của chị. Chị có thể cho em xem thêm một số mẫu khác không ạ?',
      type: 'TEXT' as MessageType,
      isRead: true,
      readAt: new Date('2024-12-01T10:30:00Z'),
      createdAt: new Date('2024-12-01T10:00:00Z'),
    },
    {
      senderId: '11111111-1111-1111-1111-111111111111', // Mai
      receiverId: '55555555-5555-5555-5555-555555555555', // Linh
      content:
        'Chào em! Cảm ơn em đã quan tâm sản phẩm. Chị sẽ gửi em một số hình ảnh sản phẩm mới nhé.',
      type: 'TEXT' as MessageType,
      attachments: [
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/messages/binh-hoa-moi-1.jpg',
        'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/messages/binh-hoa-moi-2.jpg',
      ],
      productMentions: [
        {
          productId: 'prod-binh-hoa-bat-trang',
          name: 'Bình Hoa Gốm Sứ Bát Tràng',
          imageUrl: 'https://res.cloudinary.com/dwdwwa0qw/image/upload/v1/products/binh-hoa-1.jpg',
        },
      ],
      isRead: false,
      createdAt: new Date('2024-12-01T11:00:00Z'),
    },
  ];

  // Tạo message đầu tiên
  for (const messageData of messagesData) {
    await prisma.message.create({
      data: messageData,
    });
  }

  // Tạo message có quoteRequestId riêng (nếu có quotes)
  if (quotes.length > 0) {
    await prisma.message.create({
      data: {
        senderId: '77777777-7777-7777-7777-777777777777', // Thu
        receiverId: '33333333-3333-3333-3333-333333333333', // Hồng
        content:
          'Chị ơi, em muốn đặt custom một chiếc áo dài thêu hoa mai. Chị có thể tư vấn giúp em không ạ?',
        type: 'TEXT' as MessageType,
        quoteRequestId: quotes[0]!.id, // An toàn vì đã check length > 0
        isRead: true,
        readAt: new Date('2024-11-28T17:00:00Z'),
        createdAt: new Date('2024-11-28T16:30:00Z'),
      },
    });
  }

  // Notifications
  const notificationsData = [
    {
      recipientId: '11111111-1111-1111-1111-111111111111', // Mai
      senderId: '55555555-5555-5555-5555-555555555555', // Linh
      type: 'FOLLOW' as NotificationType,
      title: 'Bạn có người theo dõi mới',
      message: 'Nguyễn Thúy Linh đã bắt đầu theo dõi bạn',
      data: {
        followerId: '55555555-5555-5555-5555-555555555555',
        followerName: 'Nguyễn Thúy Linh',
      },
      actionUrl: '/profile/55555555-5555-5555-5555-555555555555',
      isRead: true,
      readAt: new Date('2024-11-25T10:00:00Z'),
      createdAt: new Date('2024-11-25T09:30:00Z'),
    },
    {
      recipientId: '22222222-2222-2222-2222-222222222222', // Long
      senderId: '77777777-7777-7777-7777-777777777777', // Thu
      type: 'ORDER_UPDATE' as NotificationType,
      title: 'Đơn hàng mới',
      message: 'Bạn có đơn hàng mới từ Phạm Thị Thu',
      data: {
        orderId: 'order-002',
        orderNumber: 'AC20241202002',
        amount: 200000.0,
      },
      actionUrl: '/orders/order-002',
      isRead: false,
      createdAt: new Date('2024-12-02T09:00:00Z'),
    },
    {
      recipientId: '33333333-3333-3333-3333-333333333333', // Hồng
      senderId: '77777777-7777-7777-7777-777777777777', // Thu
      type: 'QUOTE_REQUEST' as NotificationType,
      title: 'Yêu cầu báo giá mới',
      message: 'Phạm Thị Thu muốn đặt custom áo dài thêu hoa mai',
      data: {
        quoteId: quotes[0]?.id,
        productName: 'Áo Dài Thêu Hoa Mai Theo Yêu Cầu',
      },
      actionUrl: `/quotes/${quotes[0]?.id || ''}`,
      isRead: false,
      createdAt: new Date('2024-11-28T16:00:00Z'),
    },
    {
      recipientId: '55555555-5555-5555-5555-555555555555', // Linh
      type: 'SYSTEM' as NotificationType,
      title: 'Chào mừng đến với Artisan Connect!',
      message: 'Khám phá những sản phẩm thủ công tuyệt vời từ các nghệ nhân Việt Nam',
      data: {
        type: 'welcome',
      },
      actionUrl: '/explore',
      isRead: true,
      readAt: new Date('2024-11-15T10:00:00Z'),
      createdAt: new Date('2024-11-15T09:00:00Z'),
    },
  ];

  for (const notificationData of notificationsData) {
    await prisma.notification.create({
      data: notificationData,
    });
  }

  console.log('✅ Seed data hoàn thành!');
  console.log(`
  📊 Dữ liệu đã tạo:
  - 👥 Users: 1 Admin + 4 Artisans + 3 Customers  
  - 🏪 Artisan Shops: 4 cửa hàng
  - 📂 Categories: 5 danh mục sản phẩm
  - 🛍️ Products: 5 sản phẩm với variants
  - 📝 Posts: 3 bài viết từ artisans
  - 💬 Social: Follows, likes, comments
  - 🛒 Orders: 2 đơn hàng mẫu
  - ⭐ Reviews: 3 đánh giá sản phẩm
  - 💰 Negotiations: 2 thương lượng giá
  - 📋 Quotes: 2 yêu cầu custom order
  - 💌 Messages & Notifications
  `);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
