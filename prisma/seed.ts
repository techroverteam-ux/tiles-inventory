import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')
  
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@tiles.com' },
    update: {},
    create: {
      email: 'admin@tiles.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin user created')

  // Create CERA Tiles brand and other brands
  const ceraBrand = await prisma.brand.create({
    data: {
      name: 'CERA Tiles',
      description: 'Premium ceramic and vitrified tiles manufacturer',
      contactInfo: 'contact@ceratiles.com',
      isActive: true,
    },
  })

  const kajariaBrand = await prisma.brand.create({
    data: {
      name: 'Kajaria',
      description: 'Leading tiles manufacturer in India',
      contactInfo: 'contact@kajaria.com',
      isActive: true,
    },
  })

  const somanyBrand = await prisma.brand.create({
    data: {
      name: 'Somany',
      description: 'Premium ceramic tiles and sanitaryware',
      contactInfo: 'info@somany.com',
      isActive: true,
    },
  })

  console.log('✅ Brands created')

  // Create CERA Tiles categories
  const wallTilesCategory = await prisma.category.create({
    data: {
      name: 'Wall Tiles',
      description: 'Decorative ceramic wall tiles',
      isActive: true,
    },
  })

  const digitalGlazedCategory = await prisma.category.create({
    data: {
      name: 'Digital Glazed Vitrified Tiles',
      description: 'High-definition digital printed vitrified tiles',
      isActive: true,
    },
  })

  const parkingTilesCategory = await prisma.category.create({
    data: {
      name: 'Parking Tiles',
      description: 'Heavy-duty tiles for parking areas',
      isActive: true,
    },
  })

  const porcelainTilesCategory = await prisma.category.create({
    data: {
      name: 'Porcelain Tiles',
      description: 'Premium porcelain tiles for luxury applications',
      isActive: true,
    },
  })

  // Additional categories for other brands
  const floorCategory = await prisma.category.create({
    data: {
      name: 'Floor Tiles',
      description: 'Durable tiles for flooring applications',
      isActive: true,
    },
  })

  const bathroomCategory = await prisma.category.create({
    data: {
      name: 'Bathroom Tiles',
      description: 'Water-resistant tiles for bathrooms',
      isActive: true,
    },
  })

  console.log('✅ Categories created')

  // Create CERA Tiles sizes
  const size300x300 = await prisma.size.create({
    data: {
      name: '300x300mm',
      description: 'Standard small format tile',
      length: 300,
      width: 300,
      isActive: true,
    },
  })

  const size300x600 = await prisma.size.create({
    data: {
      name: '300x600mm',
      description: 'Popular wall tile format',
      length: 300,
      width: 600,
      isActive: true,
    },
  })

  const size300x450 = await prisma.size.create({
    data: {
      name: '300x450mm',
      description: 'Standard wall tile size',
      length: 300,
      width: 450,
      isActive: true,
    },
  })

  const size600x600 = await prisma.size.create({
    data: {
      name: '600x600mm',
      description: 'Standard large format tile',
      length: 600,
      width: 600,
      isActive: true,
    },
  })

  const size600x1200 = await prisma.size.create({
    data: {
      name: '600x1200mm',
      description: 'Large format rectangular tile',
      length: 600,
      width: 1200,
      isActive: true,
    },
  })

  const size800x1600 = await prisma.size.create({
    data: {
      name: '800x1600mm',
      description: 'Extra large format tile',
      length: 800,
      width: 1600,
      isActive: true,
    },
  })

  const size1200x1800 = await prisma.size.create({
    data: {
      name: '1200x1800mm',
      description: 'Premium large format tile',
      length: 1200,
      width: 1800,
      isActive: true,
    },
  })

  const size800x2400 = await prisma.size.create({
    data: {
      name: '800x2400mm',
      description: 'Slab format tile',
      length: 800,
      width: 2400,
      isActive: true,
    },
  })

  const size800x3000 = await prisma.size.create({
    data: {
      name: '800x3000mm',
      description: 'Extra large slab format',
      length: 800,
      width: 3000,
      isActive: true,
    },
  })

  // Additional sizes for other brands
  const size800x800 = await prisma.size.create({
    data: {
      name: '800x800mm',
      description: 'Large format floor tile',
      length: 800,
      width: 800,
      isActive: true,
    },
  })

  console.log('✅ Sizes created')

  // Create CERA Tiles finish types
  const glossyFinish = await prisma.finishType.create({
    data: {
      name: 'Glossy',
      description: 'High gloss finish for easy cleaning',
      isActive: true,
    },
  })

  const mattFinish = await prisma.finishType.create({
    data: {
      name: 'Matt',
      description: 'Matte finish for non-slip surface',
      isActive: true,
    },
  })

  const mattGranulaFinish = await prisma.finishType.create({
    data: {
      name: 'Matt Granula',
      description: 'Textured matte finish with granular surface',
      isActive: true,
    },
  })

  console.log('✅ Finish types created')

  // Create CERA Tiles collections
  const subwayCollection = await prisma.collection.create({
    data: {
      name: 'SUBWAY',
      description: 'Classic subway tile collection',
      isActive: true,
    },
  })

  const lucidoCollection = await prisma.collection.create({
    data: {
      name: 'LUCIDO',
      description: 'Glossy finish tile collection',
      isActive: true,
    },
  })

  const identityCollection = await prisma.collection.create({
    data: {
      name: 'IDENTITY',
      description: 'Contemporary design collection',
      isActive: true,
    },
  })

  const eternoCollection = await prisma.collection.create({
    data: {
      name: 'ETERNO',
      description: 'Timeless elegance collection',
      isActive: true,
    },
  })

  const patioCollection = await prisma.collection.create({
    data: {
      name: 'PATIO',
      description: 'Outdoor and patio tile collection',
      isActive: true,
    },
  })

  const digitaleCollection = await prisma.collection.create({
    data: {
      name: 'DIGITALE',
      description: 'Digital print technology collection',
      isActive: true,
    },
  })

  console.log('✅ Collections created')

  // Create sample locations
  const mainWarehouse = await prisma.location.create({
    data: {
      name: 'Main Warehouse',
      address: '123 Industrial Area, Sector 15, Gurgaon, Haryana',
      isActive: true,
    },
  })

  const showroomDelhi = await prisma.location.create({
    data: {
      name: 'Showroom Delhi',
      address: '456 Tile Market, Karol Bagh, New Delhi',
      isActive: true,
    },
  })

  const branchMumbai = await prisma.location.create({
    data: {
      name: 'Branch Mumbai',
      address: '789 Commercial Complex, Andheri East, Mumbai',
      isActive: true,
    },
  })

  console.log('✅ Locations created')

  // Create CERA Tiles products
  const subwayWhite = await prisma.product.create({
    data: {
      name: 'Subway White',
      code: 'CERA-SUB-001',
      description: 'Classic white subway tiles',
      brandId: ceraBrand.id,
      categoryId: wallTilesCategory.id,
      collectionId: subwayCollection.id,
      sizeId: size300x600.id,
      finishTypeId: glossyFinish.id,
      sqftPerBox: 4.5,
      pcsPerBox: 6,
      imageUrl: 'https://example.com/subway-white.jpg',
      isActive: true,
    },
  })

  const lucidoMarble = await prisma.product.create({
    data: {
      name: 'Lucido Marble',
      code: 'CERA-LUC-002',
      description: 'High-gloss marble effect digital tiles',
      brandId: ceraBrand.id,
      categoryId: digitalGlazedCategory.id,
      collectionId: lucidoCollection.id,
      sizeId: size600x600.id,
      finishTypeId: glossyFinish.id,
      sqftPerBox: 4.0,
      pcsPerBox: 2,
      imageUrl: 'https://example.com/lucido-marble.jpg',
      isActive: true,
    },
  })

  const identityWood = await prisma.product.create({
    data: {
      name: 'Identity Wood',
      code: 'CERA-ID-003',
      description: 'Wood-look porcelain tiles',
      brandId: ceraBrand.id,
      categoryId: porcelainTilesCategory.id,
      collectionId: identityCollection.id,
      sizeId: size600x1200.id,
      finishTypeId: mattFinish.id,
      sqftPerBox: 8.0,
      pcsPerBox: 1,
      imageUrl: 'https://example.com/identity-wood.jpg',
      isActive: true,
    },
  })

  const eternoStone = await prisma.product.create({
    data: {
      name: 'Eterno Stone',
      code: 'CERA-ET-004',
      description: 'Natural stone effect large format tiles',
      brandId: ceraBrand.id,
      categoryId: porcelainTilesCategory.id,
      collectionId: eternoCollection.id,
      sizeId: size800x1600.id,
      finishTypeId: mattGranulaFinish.id,
      sqftPerBox: 12.0,
      pcsPerBox: 1,
      imageUrl: 'https://example.com/eterno-stone.jpg',
      isActive: true,
    },
  })

  const patioGrey = await prisma.product.create({
    data: {
      name: 'Patio Grey',
      code: 'CERA-PAT-005',
      description: 'Heavy-duty outdoor parking tiles',
      brandId: ceraBrand.id,
      categoryId: parkingTilesCategory.id,
      collectionId: patioCollection.id,
      sizeId: size300x300.id,
      finishTypeId: mattGranulaFinish.id,
      sqftPerBox: 3.0,
      pcsPerBox: 9,
      imageUrl: 'https://example.com/patio-grey.jpg',
      isActive: true,
    },
  })

  const digitaleMarble = await prisma.product.create({
    data: {
      name: 'Digitale Marble Supreme',
      code: 'CERA-DIG-006',
      description: 'Premium digital marble print tiles',
      brandId: ceraBrand.id,
      categoryId: digitalGlazedCategory.id,
      collectionId: digitaleCollection.id,
      sizeId: size1200x1800.id,
      finishTypeId: glossyFinish.id,
      sqftPerBox: 24.0,
      pcsPerBox: 1,
      imageUrl: 'https://example.com/digitale-marble.jpg',
      isActive: true,
    },
  })

  // Additional products for other brands
  const kajariaPremium = await prisma.product.create({
    data: {
      name: 'Kajaria Premium Floor',
      code: 'KAJ-PF-001',
      brandId: kajariaBrand.id,
      categoryId: floorCategory.id,
      sizeId: size600x600.id,
      finishTypeId: glossyFinish.id,
      sqftPerBox: 4.0,
      pcsPerBox: 2,
      imageUrl: 'https://example.com/kajaria-premium.jpg',
      isActive: true,
    },
  })

  const somanyBathroom = await prisma.product.create({
    data: {
      name: 'Somany Bathroom Elite',
      code: 'SOM-BE-001',
      brandId: somanyBrand.id,
      categoryId: bathroomCategory.id,
      sizeId: size800x800.id,
      finishTypeId: mattFinish.id,
      sqftPerBox: 5.0,
      pcsPerBox: 1,
      imageUrl: 'https://example.com/somany-bathroom.jpg',
      isActive: true,
    },
  })

  console.log('✅ Products created')

  // Create sample inventory batches for CERA products
  const batch1 = await prisma.batch.create({
    data: {
      batchNumber: 'CERA-SUB-001-2024',
      productId: subwayWhite.id,
      locationId: mainWarehouse.id,
      quantity: 200,
      purchasePrice: 85.0,
      sellingPrice: 110.0,
      receivedDate: new Date('2024-01-15'),
      isActive: true,
    },
  })

  const batch2 = await prisma.batch.create({
    data: {
      batchNumber: 'CERA-LUC-002-2024',
      productId: lucidoMarble.id,
      locationId: mainWarehouse.id,
      quantity: 150,
      purchasePrice: 180.0,
      sellingPrice: 220.0,
      receivedDate: new Date('2024-01-20'),
      isActive: true,
    },
  })

  const batch3 = await prisma.batch.create({
    data: {
      batchNumber: 'CERA-ID-003-2024',
      productId: identityWood.id,
      locationId: showroomDelhi.id,
      quantity: 100,
      purchasePrice: 320.0,
      sellingPrice: 380.0,
      receivedDate: new Date('2024-01-25'),
      isActive: true,
    },
  })

  const batch4 = await prisma.batch.create({
    data: {
      batchNumber: 'CERA-ET-004-2024',
      productId: eternoStone.id,
      locationId: branchMumbai.id,
      quantity: 75,
      purchasePrice: 450.0,
      sellingPrice: 550.0,
      receivedDate: new Date('2024-02-01'),
      isActive: true,
    },
  })

  const batch5 = await prisma.batch.create({
    data: {
      batchNumber: 'CERA-PAT-005-2024',
      productId: patioGrey.id,
      locationId: mainWarehouse.id,
      quantity: 300,
      purchasePrice: 65.0,
      sellingPrice: 85.0,
      receivedDate: new Date('2024-02-05'),
      isActive: true,
    },
  })

  const batch6 = await prisma.batch.create({
    data: {
      batchNumber: 'CERA-DIG-006-2024',
      productId: digitaleMarble.id,
      locationId: showroomDelhi.id,
      quantity: 50,
      purchasePrice: 850.0,
      sellingPrice: 1050.0,
      receivedDate: new Date('2024-02-10'),
      isActive: true,
    },
  })

  console.log('✅ Inventory batches created')

  console.log('\n🎉 Database seeded successfully!')
  console.log('📊 Summary:')
  console.log('- Admin User: 1')
  console.log('- Brands: 3 (CERA Tiles, Kajaria, Somany)')
  console.log('- Categories: 6 (Wall Tiles, Digital Glazed Vitrified, Parking, Porcelain, Floor, Bathroom)')
  console.log('- Collections: 6 (SUBWAY, LUCIDO, IDENTITY, ETERNO, PATIO, DIGITALE)')
  console.log('- Sizes: 10 (300x300 to 800x3000mm)')
  console.log('- Finish Types: 3 (Glossy, Matt, Matt Granula)')
  console.log('- Locations: 3 (Main Warehouse, Delhi Showroom, Mumbai Branch)')
  console.log('- Products: 8 (6 CERA + 2 others)')
  console.log('- Inventory Batches: 6')
  console.log('\n🔑 Login Credentials:')
  console.log('Email: admin@tiles.com')
  console.log('Password: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })