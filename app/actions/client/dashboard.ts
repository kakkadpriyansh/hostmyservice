"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SubscriptionWithPlan } from "@/types";

export async function getClientSubscriptions(): Promise<SubscriptionWithPlan[]> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        site: true,
        plan: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return subscriptions.map(sub => ({
        ...sub,
        domain: sub.site?.domain || null
    }));
  } catch (error) {
    console.error("Failed to fetch client subscriptions:", error);
    return [];
  }
}
