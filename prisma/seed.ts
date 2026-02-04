import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hostmyservice.com' },
    update: {},
    create: {
      email: 'admin@hostmyservice.com',
      name: 'Admin User',
      password,
      role: 'ADMIN',
    },
  })

  console.log({ admin })

  const plans = [
    {
      name: 'Starter',
      price: 199,
      duration: 30,
      description: 'Perfect for personal websites and blogs',
      isActive: true,
    },
    {
      name: 'Professional',
      price: 499,
      duration: 30,
      description: 'For businesses and growing projects',
      isActive: true,
    },
    {
      name: 'Enterprise',
      price: 999,
      duration: 30,
      description: 'High performance for demanding applications',
      isActive: true,
    },
  ]

  for (const plan of plans) {
    const p = await prisma.plan.create({
      data: plan,
    })
    console.log(`Created plan with id: ${p.id}`)
  }

  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
