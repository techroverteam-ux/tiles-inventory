/**
 * Create (or reset) an admin login.
 * Usage:  npx tsx scripts/create-admin.ts <email> <password> [name]
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const [email, password, name = 'Super Admin'] = process.argv.slice(2)
  if (!email || !password) {
    console.error('Usage: npx tsx scripts/create-admin.ts <email> <password> [name]')
    process.exit(1)
  }
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { password: hashed, role: 'ADMIN', isActive: true, name },
    create: { email: email.toLowerCase(), password: hashed, role: 'ADMIN', isActive: true, name },
  })
  console.log(`✅ Admin ready: ${user.email}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
