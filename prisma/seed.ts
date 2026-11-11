/**
 * Development seed: one admin account and a few sample plans.
 * Never put real users, payments or production data in this file.
 *
 * Usage:
 *   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='a-long-password' npx prisma db seed
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (at least 12 characters).");
  }

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Admin",
      password: await bcrypt.hash(password, 12),
      role: Role.ADMIN,
    },
  });
  console.log(`Admin user ready: ${email}`);

  // Prices are yearly (see components/pricing-section.tsx)
  const plans = [
    {
      name: "Basic Host",
      price: 1420,
      description: "Static websites for startups",
      features: ["Static Website Hosting", "Free SSL Certificate", "DDoS Protection"],
    },
    {
      name: "Smart Host",
      price: 1799,
      description: "Node.js apps with environment variables",
      features: ["Node.js Hosting", "Free SSL Certificate", "DDoS Protection", "Environment Variables"],
      requiresEnv: true,
    },
    {
      name: "Smart Host + DB",
      price: 2029,
      description: "Node.js apps with a dedicated MongoDB database",
      features: ["Node.js Hosting", "Free SSL Certificate", "Dedicated MongoDB Database"],
      requiresEnv: true,
      providesDb: true,
      dbType: "MONGODB" as const,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name, deletedAt: null } });
    if (!existing) {
      await prisma.plan.create({ data: { duration: 365, ...plan } });
    }
  }
  console.log(`Seeded ${plans.length} sample plans`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
