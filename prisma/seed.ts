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

  // Create sample brands (without fixed IDs for MongoDB)
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

  const nitcoBrand = await prisma.brand.create({
    data: {
      name: 'Nitco',
      description: 'Innovative tile solutions',
      contactInfo: 'sales@nitco.com',
      isActive: true,
    },
  })

  console.log('✅ Brands created')

  // Create sample categories
  const floorCategory = await prisma.category.create({
    data: {
      name: 'Floor Tiles',
      description: 'Durable tiles for flooring applications',
      brandId: kajariaBrand.id,
      isActive: true,
    },
  })

  const wallCategory = await prisma.category.create({
    data: {
      name: 'Wall Tiles',
      description: 'Decorative tiles for wall applications',
      brandId: kajariaBrand.id,
      isActive: true,
    },
  })

  const bathroomCategory = await prisma.category.create({
    data: {
      name: 'Bathroom Tiles',
      description: 'Water-resistant tiles for bathrooms',
      brandId: somanyBrand.id,
      isActive: true,
    },
  })

  const kitchenCategory = await prisma.category.create({
    data: {
      name: 'Kitchen Tiles',
      description: 'Heat and stain resistant tiles for kitchens',
      brandId: nitcoBrand.id,
      isActive: true,
    },
  })

  console.log('✅ Categories created')

  // Create sample sizes
  const size600x600 = await prisma.size.create({
    data: {
      name: '600x600mm',
      description: 'Standard large format tile',
      length: 600,
      width: 600,
      brandId: kajariaBrand.id,
      categoryId: floorCategory.id,
      isActive: true,
    },
  })

  const size300x450 = await prisma.size.create({
    data: {
      name: '300x450mm',
      description: 'Standard wall tile size',
      length: 300,
      width: 450,
      brandId: kajariaBrand.id,
      categoryId: wallCategory.id,
      isActive: true,
    },
  })

  const size800x800 = await prisma.size.create({
    data: {
      name: '800x800mm',
      description: 'Large format floor tile',
      length: 800,
      width: 800,
      brandId: somanyBrand.id,
      categoryId: bathroomCategory.id,
      isActive: true,
    },
  })

  const size200x300 = await prisma.size.create({
    data: {
      name: '200x300mm',
      description: 'Small format decorative tile',
      length: 200,
      width: 300,
      brandId: nitcoBrand.id,
      categoryId: kitchenCategory.id,
      isActive: true,
    },
  })

  console.log('✅ Sizes created')

  // Create sample finish types
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

  const texturedFinish = await prisma.finishType.create({
    data: {
      name: 'Textured',
      description: 'Textured finish for better grip',
      isActive: true,
    },
  })

  console.log('✅ Finish types created')

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

  // Create sample products
  const marbleSupreme = await prisma.product.create({
    data: {
      name: 'Marble Supreme',
      code: 'KAJ-MS-001',
      brandId: kajariaBrand.id,
      categoryId: floorCategory.id,
      sizeId: size600x600.id,
      finishTypeId: glossyFinish.id,
      sqftPerBox: 4.0,
      pcsPerBox: 2,
      imageUrl: 'https://example.com/marble-supreme.jpg',
      isActive: true,
    },
  })

  const designerWall = await prisma.product.create({
    data: {
      name: 'Designer Wall',
      code: 'KAJ-DW-002',
      brandId: kajariaBrand.id,
      categoryId: wallCategory.id,
      sizeId: size300x450.id,
      finishTypeId: glossyFinish.id,
      sqftPerBox: 2.5,
      pcsPerBox: 6,
      imageUrl: 'https://example.com/designer-wall.jpg',
      isActive: true,
    },
  })

  const bathroomTile = await prisma.product.create({
    data: {
      name: 'Bathroom Elite',
      code: 'SOM-BE-003',
      brandId: somanyBrand.id,
      categoryId: bathroomCategory.id,
      sizeId: size800x800.id,
      finishTypeId: mattFinish.id,
      sqftPerBox: 5.0,
      pcsPerBox: 1,
      imageUrl: 'https://example.com/bathroom-elite.jpg',
      isActive: true,
    },
  })

  console.log('✅ Products created')

  // Create sample inventory batches
  const batch1 = await prisma.batch.create({
    data: {
      batchNumber: 'BATCH-001-2024',
      productId: marbleSupreme.id,
      locationId: mainWarehouse.id,
      quantity: 100,
      purchasePrice: 120.0,
      sellingPrice: 150.0,
      receivedDate: new Date('2024-01-15'),
      isActive: true,
    },
  })

  const batch2 = await prisma.batch.create({
    data: {
      batchNumber: 'BATCH-002-2024',
      productId: designerWall.id,
      locationId: mainWarehouse.id,
      quantity: 150,
      purchasePrice: 80.0,
      sellingPrice: 100.0,
      receivedDate: new Date('2024-01-20'),
      isActive: true,
    },
  })

  const batch3 = await prisma.batch.create({
    data: {
      batchNumber: 'BATCH-003-2024',
      productId: bathroomTile.id,
      locationId: showroomDelhi.id,
      quantity: 75,
      purchasePrice: 200.0,
      sellingPrice: 250.0,
      receivedDate: new Date('2024-01-25'),
      isActive: true,
    },
  })

  console.log('✅ Inventory batches created')

  console.log('\n🎉 Database seeded successfully!')
  console.log('📊 Summary:')
  console.log('- Admin User: 1')
  console.log('- Brands: 3 (Kajaria, Somany, Nitco)')
  console.log('- Categories: 4 (Floor, Wall, Bathroom, Kitchen)')
  console.log('- Sizes: 4 (600x600, 300x450, 800x800, 200x300)')
  console.log('- Finish Types: 3 (Glossy, Matt, Textured)')
  console.log('- Locations: 3 (Main Warehouse, Delhi Showroom, Mumbai Branch)')
  console.log('- Products: 3 (Marble Supreme, Designer Wall, Bathroom Elite)')
  console.log('- Inventory Batches: 3')
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