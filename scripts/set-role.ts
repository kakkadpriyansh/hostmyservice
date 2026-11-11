/**
 * Changes a user's role.
 *
 * Usage:
 *   npx tsx scripts/set-role.ts <email> <ADMIN|USER>
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || (role !== "ADMIN" && role !== "USER")) {
    console.error("Usage: npx tsx scripts/set-role.ts <email> <ADMIN|USER>");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role },
    select: { email: true, role: true },
  });
  console.log(`${user.email} is now ${user.role}. They must log out and back in.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
