const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlans() {
  try {
    const plans = await prisma.plan.findMany({
      where: { deletedAt: null },
      orderBy: { price: 'asc' }
    });
    console.log(`TOTAL PLANS IN DB: ${plans.length}`);
    plans.forEach(p => {
      console.log(`[${p.isActive ? 'ACTIVE' : 'INACTIVE'}] ID: ${p.id} | Name: "${p.name}" | Price: ${p.price} | Duration: ${p.duration}`);
    });
  } catch (err) {
    console.error('Error fetching plans:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();
