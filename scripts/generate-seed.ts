
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching data from database...');

  const users = await prisma.user.findMany();
  const plans = await prisma.plan.findMany();
  const subscriptions = await prisma.subscription.findMany();
  const sites = await prisma.site.findMany();
  const payments = await prisma.payment.findMany();
  const deployments = await prisma.deployment.findMany();
  
  // Helper to format Date objects to strings for the seed file
  const formatValue = (key: string, value: any) => {
    if (value instanceof Date) {
      return `new Date('${value.toISOString()}')`;
    }
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
    return value;
  };

  // Helper to generate object string
  const generateObjectString = (obj: any) => {
    const entries = Object.entries(obj).map(([key, value]) => {
      return `${key}: ${formatValue(key, value)}`;
    });
    return `{ ${entries.join(', ')} }`;
  };

  const generateArrayString = (arr: any[]) => {
    return `[\n${arr.map(item => '    ' + generateObjectString(item)).join(',\n')}\n  ]`;
  };

  const seedContent = `
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Users
  const users = ${generateArrayString(users)};

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }
  console.log(\`Seeded \${users.length} users\`);

  // 2. Plans
  const plans = ${generateArrayString(plans)};

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan,
    });
  }
  console.log(\`Seeded \${plans.length} plans\`);

  // 3. Subscriptions
  const subscriptions = ${generateArrayString(subscriptions)};

  for (const sub of subscriptions) {
    await prisma.subscription.upsert({
      where: { id: sub.id },
      update: {},
      create: sub,
    });
  }
  console.log(\`Seeded \${subscriptions.length} subscriptions\`);

  // 4. Sites
  const sites = ${generateArrayString(sites)};

  for (const site of sites) {
    await prisma.site.upsert({
      where: { id: site.id },
      update: {},
      create: site,
    });
  }
  console.log(\`Seeded \${sites.length} sites\`);

  // 5. Payments
  const payments = ${generateArrayString(payments)};

  for (const payment of payments) {
    await prisma.payment.upsert({
      where: { id: payment.id },
      update: {},
      create: payment,
    });
  }
  console.log(\`Seeded \${payments.length} payments\`);

  // 6. Deployments
  const deployments = ${generateArrayString(deployments)};

  for (const deployment of deployments) {
    await prisma.deployment.upsert({
      where: { id: deployment.id },
      update: {},
      create: deployment,
    });
  }
  console.log(\`Seeded \${deployments.length} deployments\`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

  const seedPath = path.join(process.cwd(), 'prisma', 'seed.ts');
  fs.writeFileSync(seedPath, seedContent);
  console.log(`Seed file generated at ${seedPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
