/**
 * Resets a user's password.
 *
 * Usage:
 *   npx tsx scripts/reset-password.ts <email> [newPassword]
 *
 * If no password is given, a random one is generated and printed once.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const [email, given] = process.argv.slice(2);
  if (!email) {
    console.error("Usage: npx tsx scripts/reset-password.ts <email> [newPassword]");
    process.exit(1);
  }

  const password = given || crypto.randomBytes(18).toString("base64url");
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }

  const updated = await prisma.user.updateMany({
    where: { email },
    data: { password: await bcrypt.hash(password, 12), resetToken: null, resetTokenExpiry: null },
  });

  if (updated.count === 0) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  console.log(`Password updated for ${email}`);
  if (!given) console.log(`New password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
