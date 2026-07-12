import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'Admin@123';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const adminEmails = ['admin@hostmyservice.com', 'admin@hostmyservice.in'];

  for (const email of adminEmails) {
    const updated = await prisma.user.updateMany({
      where: { email },
      data: { password: hashedPassword },
    });

    if (updated.count > 0) {
      console.log(`✅ Password updated for ${email}`);
    } else {
      console.log(`⚠️  No user found with email ${email}`);
    }
  }

  console.log(`\nAdmin credentials:`);
  console.log(`  Email:    admin@hostmyservice.com`);
  console.log(`  Password: ${newPassword}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
