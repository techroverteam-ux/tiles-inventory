import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
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

  console.log('Admin user created:', adminUser)

  // Create sample brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { id: 'kajaria-id' },
      update: {},
      create: {
        id: 'kajaria-id',
        name: 'Kajaria',
        description: 'Leading tiles manufacturer',
        contactInfo: 'contact@kajaria.com',
      },
    }),
    prisma.brand.upsert({
      where: { id: 'somany-id' },
      update: {},
      create: {
        id: 'somany-id',
        name: 'Somany',
        description: 'Premium ceramic tiles',
        contactInfo: 'info@somany.com',
      },
    }),
  ])

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'floor-tiles-id' },
      update: {},
      create: {
        id: 'floor-tiles-id',
        name: 'Floor Tiles',
        description: 'Tiles for flooring applications',
      },
    }),
    prisma.category.upsert({
      where: { id: 'wall-tiles-id' },
      update: {},
      create: {
        id: 'wall-tiles-id',
        name: 'Wall Tiles',
        description: 'Tiles for wall applications',
      },
    }),
  ])

  // Create sample finish types
  const finishTypes = await Promise.all([
    prisma.finishType.upsert({
      where: { id: 'glossy-id' },
      update: {},
      create: {
        id: 'glossy-id',
        name: 'Glossy',
        description: 'High gloss finish',
      },
    }),
    prisma.finishType.upsert({
      where: { id: 'matt-id' },
      update: {},
      create: {
        id: 'matt-id',
        name: 'Matt',
        description: 'Matte finish',
      },
    }),
  ])

  // Create sample location
  const location = await prisma.location.upsert({
    where: { id: 'main-warehouse-id' },
    update: {},
    create: {
      id: 'main-warehouse-id',
      name: 'Main Warehouse',
      address: '123 Industrial Area, City',
    },
  })

  console.log('Sample data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })