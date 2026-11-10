const fs = require('fs');

// 1. Update app/actions/admin/plans.ts
{
  const p = 'C:/Users/DELL/Desktop/hostmyservice/app/actions/admin/plans.ts';
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/providesDb\?: boolean;/g, 'providesDb?: boolean;\n  dbType?: "NONE" | "MONGODB" | "MYSQL" | "POSTGRESQL";');
  c = c.replace(/providesDb: !!data.providesDb,/g, 'providesDb: !!data.providesDb,\n        dbType: (data.dbType as any) || "NONE",');
  fs.writeFileSync(p, c, 'utf8');
  console.log('Updated app/actions/admin/plans.ts');
}

// 2. Update app/actions/admin/deploy.ts (add getPendingDeployments & triggerDeployment)
{
  const p = 'C:/Users/DELL/Desktop/hostmyservice/app/actions/admin/deploy.ts';
  let c = fs.readFileSync(p, 'utf8');
  if (!c.includes('runFullDeployment')) {
    c = `import { runFullDeployment } from "@/lib/auto-deploy";\n` + c;
    const additionalActions = `

export async function getPendingDeployments() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const deployments = await prisma.deployment.findMany({
      where: {
        status: { in: ["PENDING", "BUILDING"] },
        deletedAt: null,
      },
      include: {
        site: {
          include: {
            user: true,
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        },
        logs: {
          orderBy: { timestamp: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: deployments };
  } catch (error: any) {
    console.error("Failed to fetch pending deployments:", error);
    return { success: false, error: error.message || "Failed to fetch deployments" };
  }
}

export async function triggerDeployment(deploymentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized access" };
  }

  return await runFullDeployment(deploymentId);
}
`;
    c += additionalActions;
    fs.writeFileSync(p, c, 'utf8');
    console.log('Updated app/actions/admin/deploy.ts');
  }
}
