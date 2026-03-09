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
      where: { id: '507f1f77bcf86cd799439011' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439011',
        name: 'Kajaria',
        description: 'Leading tiles manufacturer',
        contactInfo: 'contact@kajaria.com',
      },
    }),
    prisma.brand.upsert({
      where: { id: '507f1f77bcf86cd799439012' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439012',
        name: 'Somany',
        description: 'Premium ceramic tiles',
        contactInfo: 'info@somany.com',
      },
    }),
  ])

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: '507f1f77bcf86cd799439013' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439013',
        name: 'Floor Tiles',
        description: 'Tiles for flooring applications',
      },
    }),
    prisma.category.upsert({
      where: { id: '507f1f77bcf86cd799439014' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439014',
        name: 'Wall Tiles',
        description: 'Tiles for wall applications',
      },
    }),
  ])

  // Create sample finish types
  const finishTypes = await Promise.all([
    prisma.finishType.upsert({
      where: { id: '507f1f77bcf86cd799439015' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439015',
        name: 'Glossy',
        description: 'High gloss finish',
      },
    }),
    prisma.finishType.upsert({
      where: { id: '507f1f77bcf86cd799439016' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439016',
        name: 'Matt',
        description: 'Matte finish',
      },
    }),
  ])

  // Create sample location
  const location = await prisma.location.upsert({
    where: { id: '507f1f77bcf86cd799439017' },
    update: {},
    create: {
      id: '507f1f77bcf86cd799439017',
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