import { PrismaClient, UserRole, UserStatus, ProductStatus, PostType, PostStatus, OrderStatus, PaymentStatus, DeliveryStatus, PaymentMethodType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Password123!';

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // ─── Admin ────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@artisanconnect.vn' },
    update: {},
    create: {
      email: 'admin@artisanconnect.vn',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Quản',
      lastName: 'Trị Viên',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isVerified: true,
      emailVerified: true,
    },
  });

  // ─── Artisans ─────────────────────────────────────────────────────────────
  const artisan1 = await prisma.user.upsert({
    where: { email: 'gom.su@artisanconnect.vn' },
    update: {},
    create: {
      email: 'gom.su@artisanconnect.vn',
      username: 'nguyenvanminh',
      password: hashedPassword,
      firstName: 'Minh',
      lastName: 'Nguyễn Văn',
      role: UserRole.ARTISAN,
      status: UserStatus.ACTIVE,
      isVerified: true,
      emailVerified: true,
      bio: 'Nghệ nhân gốm sứ với hơn 15 năm kinh nghiệm, chuyên làm đồ gốm thủ công truyền thống Bát Tràng.',
    },
  });

  const artisan2 = await prisma.user.upsert({
    where: { email: 'tho.thu.cong@artisanconnect.vn' },
    update: {},
    create: {
      email: 'tho.thu.cong@artisanconnect.vn',
      username: 'tranthithu',
      password: hashedPassword,
      firstName: 'Thu',
      lastName: 'Trần Thị',
      role: UserRole.ARTISAN,
      status: UserStatus.ACTIVE,
      isVerified: true,
      emailVerified: true,
      bio: 'Nghệ nhân thêu thùa truyền thống, chuyên thêu hoa văn và tranh thêu theo yêu cầu.',
    },
  });

  const artisan3 = await prisma.user.upsert({
    where: { email: 'do.go@artisanconnect.vn' },
    update: {},
    create: {
      email: 'do.go@artisanconnect.vn',
      username: 'levanphuc',
      password: hashedPassword,
      firstName: 'Phúc',
      lastName: 'Lê Văn',
      role: UserRole.ARTISAN,
      status: UserStatus.ACTIVE,
      isVerified: false,
      emailVerified: true,
      bio: 'Thợ mộc thủ công, chuyên làm đồ nội thất gỗ tự nhiên và các vật dụng trang trí.',
    },
  });

  // ─── Artisan profiles ─────────────────────────────────────────────────────
  await prisma.artisanProfile.upsert({
    where: { userId: artisan1.id },
    update: {},
    create: {
      userId: artisan1.id,
      shopName: 'Gốm Bát Tràng Minh',
      shopDescription: 'Xưởng gốm truyền thống tại làng Bát Tràng, Hà Nội. Chuyên sản xuất gốm sứ thủ công theo đơn đặt hàng và bán lẻ.',
      specialties: ['Gốm sứ', 'Bát Tràng', 'Thủ công mỹ nghệ'],
      experience: 15,
      isVerified: true,
      rating: 4.8,
      reviewCount: 120,
    },
  });

  await prisma.artisanProfile.upsert({
    where: { userId: artisan2.id },
    update: {},
    create: {
      userId: artisan2.id,
      shopName: 'Tranh Thêu Thu Hương',
      shopDescription: 'Xưởng thêu thủ công chuyên tranh thêu, áo dài thêu và phụ kiện thêu cao cấp.',
      specialties: ['Thêu thùa', 'Tranh thêu', 'Áo dài thêu'],
      experience: 10,
      isVerified: true,
      rating: 4.6,
      reviewCount: 85,
    },
  });

  await prisma.artisanProfile.upsert({
    where: { userId: artisan3.id },
    update: {},
    create: {
      userId: artisan3.id,
      shopName: 'Đồ Gỗ Phúc Lộc',
      shopDescription: 'Xưởng mộc chuyên sản xuất đồ nội thất gỗ tự nhiên, trang trí nội thất và quà tặng gỗ.',
      specialties: ['Đồ gỗ', 'Nội thất gỗ', 'Đồ trang trí'],
      experience: 8,
      isVerified: false,
      rating: 4.3,
      reviewCount: 42,
    },
  });

  // ─── Artisan profiles (Profile table) ─────────────────────────────────────
  const artisan1Profile = await prisma.profile.upsert({
    where: { userId: artisan1.id },
    update: {},
    create: {
      userId: artisan1.id,
      location: 'Bát Tràng, Gia Lâm, Hà Nội',
    },
  });

  const artisan2Profile = await prisma.profile.upsert({
    where: { userId: artisan2.id },
    update: {},
    create: {
      userId: artisan2.id,
      location: 'Quận 3, TP. Hồ Chí Minh',
    },
  });

  const artisan3Profile = await prisma.profile.upsert({
    where: { userId: artisan3.id },
    update: {},
    create: {
      userId: artisan3.id,
      location: 'Hội An, Quảng Nam',
    },
  });

  // ─── Customers ────────────────────────────────────────────────────────────
  const customer1 = await prisma.user.upsert({
    where: { email: 'khachhang1@example.com' },
    update: {},
    create: {
      email: 'khachhang1@example.com',
      username: 'phamthilanhuong',
      password: hashedPassword,
      firstName: 'Lan Hương',
      lastName: 'Phạm Thị',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      isVerified: false,
      emailVerified: true,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'khachhang2@example.com' },
    update: {},
    create: {
      email: 'khachhang2@example.com',
      username: 'hoangminhquan',
      password: hashedPassword,
      firstName: 'Minh Quân',
      lastName: 'Hoàng',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      isVerified: false,
      emailVerified: true,
    },
  });

  // ─── Customer profiles + addresses ───────────────────────────────────────
  const customer1Profile = await prisma.profile.upsert({
    where: { userId: customer1.id },
    update: {},
    create: {
      userId: customer1.id,
      location: 'Cầu Giấy, Hà Nội',
    },
  });

  await prisma.address.upsert({
    where: { id: 'seed-address-customer1' },
    update: {},
    create: {
      id: 'seed-address-customer1',
      profileId: customer1Profile.id,
      fullName: 'Phạm Thị Lan Hương',
      phone: '0901234567',
      street: '12 Đường Xuân Thủy',
      city: 'Hà Nội',
      state: 'Hà Nội',
      zipCode: '100000',
      country: 'Vietnam',
      isDefault: true,
    },
  });

  const customer2Profile = await prisma.profile.upsert({
    where: { userId: customer2.id },
    update: {},
    create: {
      userId: customer2.id,
      location: 'Bình Thạnh, TP. Hồ Chí Minh',
    },
  });

  await prisma.address.upsert({
    where: { id: 'seed-address-customer2' },
    update: {},
    create: {
      id: 'seed-address-customer2',
      profileId: customer2Profile.id,
      fullName: 'Hoàng Minh Quân',
      phone: '0907654321',
      street: '45 Đường Đinh Tiên Hoàng',
      city: 'TP. Hồ Chí Minh',
      state: 'TP. Hồ Chí Minh',
      zipCode: '700000',
      country: 'Vietnam',
      isDefault: true,
    },
  });

  // ─── Categories ───────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'gom-su' },
      update: {},
      create: { name: 'Gốm sứ', slug: 'gom-su', isActive: true, sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'theu-thua' },
      update: {},
      create: { name: 'Thêu thùa', slug: 'theu-thua', isActive: true, sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'do-go-thu-cong' },
      update: {},
      create: { name: 'Đồ gỗ thủ công', slug: 'do-go-thu-cong', isActive: true, sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { slug: 'trang-suc-handmade' },
      update: {},
      create: { name: 'Trang sức handmade', slug: 'trang-suc-handmade', isActive: true, sortOrder: 4 },
    }),
    prisma.category.upsert({
      where: { slug: 'do-da-thu-cong' },
      update: {},
      create: { name: 'Đồ da thủ công', slug: 'do-da-thu-cong', isActive: true, sortOrder: 5 },
    }),
  ]);

  const [catGom, catTheu, catGo] = categories;

  // ─── Products ─────────────────────────────────────────────────────────────
  const product1 = await prisma.product.upsert({
    where: { slug: 'binh-gom-bat-trang-hoa-sen' },
    update: {},
    create: {
      sellerId: artisan1.id,
      name: 'Bình gốm Bát Tràng vẽ hoa sen',
      slug: 'binh-gom-bat-trang-hoa-sen',
      description: 'Bình gốm Bát Tràng thủ công, vẽ tay hoa sen truyền thống. Màu men trắng xanh tinh tế, phù hợp trang trí nội thất.',
      price: 350000,
      quantity: 25,
      status: ProductStatus.PUBLISHED,
      allowNegotiation: true,
      tags: ['gốm', 'bát tràng', 'hoa sen', 'trang trí'],
      images: [],
    },
  });

  const product2 = await prisma.product.upsert({
    where: { slug: 'bo-chen-tra-gom-tu-quy' },
    update: {},
    create: {
      sellerId: artisan1.id,
      name: 'Bộ chén trà gốm tứ quý',
      slug: 'bo-chen-tra-gom-tu-quy',
      description: 'Bộ 4 chén trà gốm sứ tứ quý (xuân - hạ - thu - đông). Đất nung cao cấp, an toàn với thực phẩm.',
      price: 480000,
      quantity: 15,
      status: ProductStatus.PUBLISHED,
      allowNegotiation: true,
      tags: ['gốm', 'chén trà', 'quà tặng'],
      images: [],
    },
  });

  const product3 = await prisma.product.upsert({
    where: { slug: 'tranh-theu-dong-que-viet-nam' },
    update: {},
    create: {
      sellerId: artisan2.id,
      name: 'Tranh thêu đồng quê Việt Nam',
      slug: 'tranh-theu-dong-que-viet-nam',
      description: 'Tranh thêu tay phong cảnh đồng quê Việt Nam, kích thước 40x60cm. Khung gỗ sồi cao cấp, có thể treo ngay sau khi nhận.',
      price: 1200000,
      quantity: 8,
      status: ProductStatus.PUBLISHED,
      allowNegotiation: false,
      tags: ['tranh thêu', 'đồng quê', 'thủ công', 'trang trí'],
      images: [],
    },
  });

  const product4 = await prisma.product.upsert({
    where: { slug: 'hop-go-trang-tri-khac-hoa-van' },
    update: {},
    create: {
      sellerId: artisan3.id,
      name: 'Hộp gỗ trang trí khắc hoa văn',
      slug: 'hop-go-trang-tri-khac-hoa-van',
      description: 'Hộp gỗ thủ công khắc hoa văn truyền thống, gỗ thông tự nhiên. Dùng để đựng đồ trang sức, quà lưu niệm.',
      price: 280000,
      quantity: 30,
      status: ProductStatus.PUBLISHED,
      allowNegotiation: true,
      tags: ['đồ gỗ', 'hộp gỗ', 'quà tặng', 'thủ công'],
      images: [],
    },
  });

  const product5 = await prisma.product.upsert({
    where: { slug: 'khay-go-phuc-vu-tra' },
    update: {},
    create: {
      sellerId: artisan3.id,
      name: 'Khay gỗ phục vụ trà',
      slug: 'khay-go-phuc-vu-tra',
      description: 'Khay gỗ thủ công dùng để bày trà, phong cách tối giản Nhật Bản. Gỗ tếch tự nhiên, kích thước 30x20cm.',
      price: 420000,
      quantity: 20,
      status: ProductStatus.PUBLISHED,
      allowNegotiation: true,
      tags: ['đồ gỗ', 'khay trà', 'tối giản', 'phong cách Nhật'],
      images: [],
    },
  });

  // ─── Category-Product links ───────────────────────────────────────────────
  const categoryProductLinks = [
    { categoryId: catGom.id, productId: product1.id },
    { categoryId: catGom.id, productId: product2.id },
    { categoryId: catTheu.id, productId: product3.id },
    { categoryId: catGo.id, productId: product4.id },
    { categoryId: catGo.id, productId: product5.id },
  ];

  for (const link of categoryProductLinks) {
    await prisma.categoryProduct.upsert({
      where: { categoryId_productId: link },
      update: {},
      create: link,
    });
  }

  // ─── Posts ────────────────────────────────────────────────────────────────
  await prisma.post.upsert({
    where: { slug: 'bi-quyet-lam-gom-bat-trang-truyen-thong' },
    update: {},
    create: {
      userId: artisan1.id,
      title: 'Bí quyết làm gốm Bát Tràng truyền thống',
      slug: 'bi-quyet-lam-gom-bat-trang-truyen-thong',
      summary: 'Chia sẻ kinh nghiệm 15 năm làm gốm tại làng Bát Tràng, từ chọn đất, tạo hình đến nung gốm.',
      content: {
        blocks: [
          {
            type: 'paragraph',
            order: 0,
            data: { text: 'Làng gốm Bát Tràng có lịch sử hơn 500 năm, nằm bên bờ sông Hồng thuộc huyện Gia Lâm, Hà Nội.' },
          },
          {
            type: 'heading',
            order: 1,
            data: { text: 'Chọn đất làm gốm' },
          },
          {
            type: 'paragraph',
            order: 2,
            data: { text: 'Đất làm gốm Bát Tràng truyền thống là đất cao lanh trắng, có độ dẻo cao và ít tạp chất. Sau khi khai thác, đất được ngâm nước và lọc qua nhiều lần trước khi sử dụng.' },
          },
          {
            type: 'heading',
            order: 3,
            data: { text: 'Kỹ thuật tạo hình' },
          },
          {
            type: 'paragraph',
            order: 4,
            data: { text: 'Tạo hình trên bàn xoay là kỹ thuật cơ bản nhất, đòi hỏi sự kiên nhẫn và luyện tập nhiều năm. Mỗi sản phẩm được tạo hình bằng tay, không có hai sản phẩm nào giống nhau hoàn toàn.' },
          },
        ],
      },
      type: PostType.TUTORIAL,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2026-01-15'),
      tags: ['gốm', 'bát tràng', 'hướng dẫn', 'thủ công'],
    },
  });

  await prisma.post.upsert({
    where: { slug: 'cau-chuyen-phia-sau-buc-tranh-theu' },
    update: {},
    create: {
      userId: artisan2.id,
      title: 'Câu chuyện phía sau bức tranh thêu đồng quê',
      slug: 'cau-chuyen-phia-sau-buc-tranh-theu',
      summary: 'Hành trình 3 tháng để hoàn thành bức tranh thêu đồng quê Việt Nam — từ ý tưởng đến tác phẩm.',
      content: {
        blocks: [
          {
            type: 'paragraph',
            order: 0,
            data: { text: 'Mỗi bức tranh thêu là một hành trình. Bức tranh đồng quê này mất gần 3 tháng để hoàn thành, với hơn 200 giờ thêu tay tỉ mỉ.' },
          },
          {
            type: 'quote',
            order: 1,
            data: { text: 'Thêu tay không chỉ là nghề, đó là cách tôi kể câu chuyện về quê hương bằng từng mũi chỉ.', author: 'Trần Thị Thu' },
          },
          {
            type: 'paragraph',
            order: 2,
            data: { text: 'Cảm hứng đến từ chuyến về quê thăm bà nội ở Hà Tĩnh. Những cánh đồng lúa chín vàng, đàn trâu thong dong — tất cả trở thành nguyên liệu cho tác phẩm này.' },
          },
        ],
      },
      type: PostType.BEHIND_THE_SCENES,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2026-02-10'),
      tags: ['tranh thêu', 'hành trình', 'nghệ thuật', 'đồng quê'],
    },
  });

  await prisma.post.upsert({
    where: { slug: 'gioi-thieu-san-pham-hop-go-khac-hoa-van' },
    update: {},
    create: {
      userId: artisan3.id,
      title: 'Ra mắt bộ sưu tập hộp gỗ khắc hoa văn mới',
      slug: 'gioi-thieu-san-pham-hop-go-khac-hoa-van',
      summary: 'Bộ sưu tập hộp gỗ khắc hoa văn truyền thống mới nhất từ xưởng Đồ Gỗ Phúc Lộc.',
      content: {
        blocks: [
          {
            type: 'paragraph',
            order: 0,
            data: { text: 'Chúng tôi vui mừng giới thiệu bộ sưu tập hộp gỗ khắc hoa văn mới nhất, được làm hoàn toàn từ gỗ thông tự nhiên nhập khẩu.' },
          },
          {
            type: 'list',
            order: 1,
            data: {
              items: [
                'Gỗ thông tự nhiên, không sơn hóa chất độc hại',
                'Khắc CNC kết hợp hoàn thiện thủ công',
                'Nhiều kích thước: nhỏ, vừa, lớn',
                'Phù hợp đựng đồ trang sức, quà tặng, lưu niệm',
              ],
            },
          },
          {
            type: 'paragraph',
            order: 2,
            data: { text: 'Mỗi hộp đều được đánh số thứ tự và có chứng chỉ xuất xứ. Đặt hàng ngay hôm nay để nhận ưu đãi khai trương!' },
          },
        ],
      },
      type: PostType.PRODUCT_SHOWCASE,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2026-03-01'),
      tags: ['đồ gỗ', 'hộp gỗ', 'ra mắt', 'khuyến mãi'],
    },
  });

  // ─── Orders ───────────────────────────────────────────────────────────────
  const pendingOrder = await prisma.order.upsert({
    where: { orderNumber: 'ORD-SEED-001' },
    update: {},
    create: {
      orderNumber: 'ORD-SEED-001',
      userId: customer1.id,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      deliveryStatus: DeliveryStatus.PREPARING,
      subtotal: 350000,
      shippingCost: 30000,
      totalAmount: 380000,
      items: {
        create: [
          {
            productId: product1.id,
            sellerId: artisan1.id,
            quantity: 1,
            price: 350000,
          },
        ],
      },
    },
  });

  const deliveredOrder = await prisma.order.upsert({
    where: { orderNumber: 'ORD-SEED-002' },
    update: {},
    create: {
      orderNumber: 'ORD-SEED-002',
      userId: customer2.id,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.COMPLETED,
      deliveryStatus: DeliveryStatus.DELIVERED,
      subtotal: 1200000,
      shippingCost: 50000,
      totalAmount: 1250000,
      actualDelivery: new Date('2026-03-20'),
      isRated: true,
      items: {
        create: [
          {
            productId: product3.id,
            sellerId: artisan2.id,
            quantity: 1,
            price: 1200000,
          },
        ],
      },
    },
  });

  // ─── Review ───────────────────────────────────────────────────────────────
  await prisma.review.upsert({
    where: { userId_productId: { userId: customer2.id, productId: product3.id } },
    update: {},
    create: {
      userId: customer2.id,
      productId: product3.id,
      rating: 5,
      title: 'Tranh thêu rất đẹp, chất lượng tuyệt vời',
      comment: 'Bức tranh thêu đẹp hơn cả trong ảnh. Đường thêu tỉ mỉ, màu sắc tươi sáng và bền. Đóng gói cẩn thận, giao hàng đúng hẹn. Sẽ tiếp tục ủng hộ shop!',
      isVerifiedPurchase: true,
      images: [],
    },
  });

  console.log('Seeding complete.');
  console.log('');
  console.log('Test accounts (password: Password123!):');
  console.log('  Admin:    admin@artisanconnect.vn');
  console.log('  Artisan:  gom.su@artisanconnect.vn');
  console.log('  Artisan:  tho.thu.cong@artisanconnect.vn');
  console.log('  Artisan:  do.go@artisanconnect.vn');
  console.log('  Customer: khachhang1@example.com');
  console.log('  Customer: khachhang2@example.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
