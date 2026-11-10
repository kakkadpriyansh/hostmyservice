const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSite() {
  try {
    const sites = await prisma.site.findMany({
      include: {
        subscription: { include: { plan: true } },
        deployments: { orderBy: { createdAt: 'desc' }, take: 2 }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    console.log(`RECENT SITES IN DB (${sites.length}):`);
    sites.forEach(s => {
      console.log(`Domain: "${s.domain}" | Plan: "${s.subscription?.plan?.name || 'None'}" | HasEnv: ${!!s.envVars} | Deployments: ${s.deployments.length}`);
      if (s.envVars) {
        console.log(`  Saved .env: ${JSON.stringify(s.envVars)}`);
      }
      if (s.deployments.length > 0) {
        console.log(`  Latest Deploy Status: ${s.deployments[0].status}`);
      }
    });
  } catch (e) {
    console.error('Error querying DB:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkSite();
