import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedAddresses() {
  console.log('Seeding addresses...');

  // Get all profiles to create addresses for
  const profiles = await prisma.profile.findMany({
    select: { id: true },
  });

  const vietnamCities = [
    {
      city: 'Hanoi',
      districts: ['Ba Dinh', 'Hoan Kiem', 'Hai Ba Trung', 'Dong Da', 'Cau Giay', 'Long Bien'],
    },
    {
      city: 'Ho Chi Minh City',
      districts: ['District 1', 'District 2', 'District 3', 'District 7', 'Binh Thanh', 'Thu Duc'],
    },
    {
      city: 'Da Nang',
      districts: ['Hai Chau', 'Thanh Khe', 'Son Tra', 'Ngu Hanh Son', 'Lien Chieu'],
    },
    { city: 'Hue', districts: ['Hue City', 'Huong Thuy', 'Huong Tra', 'Phu Vang'] },
    { city: 'Nha Trang', districts: ['Nha Trang City', 'Dien Khanh', 'Ninh Hoa'] },
  ];

  const internationalCities = [
    {
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: ['10001', '10002', '10003', '10004', '10005'],
    },
    {
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      zipCode: ['90001', '90002', '90003', '90004', '90005'],
    },
    {
      city: 'London',
      state: 'England',
      country: 'United Kingdom',
      zipCode: ['SW1A 1AA', 'E1 6AN', 'W1A 0AX', 'EC1A 1BB'],
    },
    {
      city: 'Paris',
      state: 'Île-de-France',
      country: 'France',
      zipCode: ['75001', '75002', '75003', '75004', '75005'],
    },
    {
      city: 'Tokyo',
      state: 'Tokyo',
      country: 'Japan',
      zipCode: ['100-0001', '100-0002', '100-0003', '100-0004'],
    },
  ];

  const streetNames = [
    'Nguyen Hue',
    'Le Loi',
    'Tran Hung Dao',
    'Pham Ngu Lao',
    'Bui Vien',
    'Dong Khoi',
    'Ly Tu Trong',
    'Thai Van Lung',
    'Le Thanh Ton',
    'Hai Ba Trung',
    'Pasteur',
    'Nam Ky Khoi Nghia',
    'Ly Thai To',
    'Tran Phu',
    'Ba Trieu',
    'Quang Trung',
    'Trang Tien',
    'Hang Bai',
  ];

  const addresses = [];

  for (const profile of profiles) {
    // Determine how many addresses to create for this profile (1-3)
    const numAddresses = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numAddresses; i++) {
      // 70% chance for Vietnam address, 30% for international
      const isVietnam = Math.random() < 0.7;

      let address;

      if (isVietnam) {
        const cityInfo = vietnamCities[Math.floor(Math.random() * vietnamCities.length)];
        const district = cityInfo.districts[Math.floor(Math.random() * cityInfo.districts.length)];
        const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
        const streetNumber = Math.floor(Math.random() * 200) + 1;

        address = {
          id: uuidv4(),
          profileId: profile.id,
          fullName: `Resident ${Math.floor(Math.random() * 1000) + 1}`,
          phone: `+84${Math.floor(Math.random() * 900000000) + 100000000}`,
          street: `${streetNumber} ${streetName} Street, ${district}`,
          city: cityInfo.city,
          state: cityInfo.city,
          zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
          country: 'Vietnam',
          isDefault: i === 0, // First address is default
        };
      } else {
        const cityInfo =
          internationalCities[Math.floor(Math.random() * internationalCities.length)];
        const zipCode = cityInfo.zipCode[Math.floor(Math.random() * cityInfo.zipCode.length)];

        address = {
          id: uuidv4(),
          profileId: profile.id,
          fullName: `Resident ${Math.floor(Math.random() * 1000) + 1}`,
          phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          street: `${Math.floor(Math.random() * 9000) + 1000} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))} Street`,
          city: cityInfo.city,
          state: cityInfo.state,
          zipCode: zipCode,
          country: cityInfo.country,
          isDefault: i === 0, // First address is default
        };
      }

      await prisma.address.create({
        data: address,
      });

      addresses.push(address);
    }
  }

  console.log(`Seeded ${addresses.length} addresses`);

  return addresses;
}

export { seedAddresses };
