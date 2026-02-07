
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.plan.count();
  const active = await prisma.plan.count({ where: { isActive: true } });
  const notDeleted = await prisma.plan.count({ where: { deletedAt: null } });
  const activeAndNotDeleted = await prisma.plan.count({ 
    where: { 
      isActive: true, 
      deletedAt: null 
    } 
  });
  
  console.log("--- DB COUNTS ---");
  console.log(`Total Plans: ${total}`);
  console.log(`Active Plans: ${active}`);
  console.log(`Not Deleted Plans: ${notDeleted}`);
  console.log(`Active AND Not Deleted Plans: ${activeAndNotDeleted}`);
  console.log("-----------------");

  // List the plans that would be shown on the landing page
  const visiblePlans = await prisma.plan.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, name: true, deletedAt: true, isActive: true }
  });
  console.log("Visible Plans:", visiblePlans);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
