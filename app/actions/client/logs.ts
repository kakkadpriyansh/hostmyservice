"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface ClientLogEntry {
  id: string;
  step: string;
  output: string;
  status: string;
  timestamp: string;
}

export interface ClientDeploymentInfo {
  deploymentId: string;
  status: "PENDING" | "BUILDING" | "DEPLOYED" | "FAILED";
  type: string;
  createdAt: string;
  logs: ClientLogEntry[];
}

export async function getClientDeploymentLogs(
  siteId: string
): Promise<{ success: boolean; data?: ClientDeploymentInfo; error?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. Verify user owns this site
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, userId: true },
    });

    if (!site || site.userId !== session.user.id) {
      return { success: false, error: "Unauthorized access to site" };
    }

    // 2. Fetch the latest deployment and its logs
    const deployment = await prisma.deployment.findFirst({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      include: {
        logs: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!deployment) {
      return { success: true, data: undefined };
    }

    return {
      success: true,
      data: {
        deploymentId: deployment.id,
        status: deployment.status as any,
        type: deployment.type,
        createdAt: deployment.createdAt.toISOString(),
        logs: deployment.logs.map((log) => ({
          id: log.id,
          step: log.step,
          output: log.output,
          status: log.status,
          timestamp: log.timestamp.toISOString(),
        })),
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch client deployment logs:", error);
    return { success: false, error: "Failed to load deployment logs" };
  }
}
