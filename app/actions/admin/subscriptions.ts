"use server";

import { getAdminSession } from "@/lib/authz";
import { resumeSiteIfExpired } from "@/lib/site-control";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { subscriptionSchema } from "@/lib/validations";

export async function createSubscription(data: {
  userId: string;
  planId: string;
  domain?: string;
  startDate: Date;
  endDate: Date;
  status?: "ACTIVE" | "EXPIRED" | "CANCELLED";
}) {
  if (!(await getAdminSession())) {
    return { success: false, error: "Unauthorized" };
  }
  const validation = subscriptionSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const subscription = await prisma.subscription.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || "ACTIVE",
        site: validation.data.domain ? {
          create: {
            domain: validation.data.domain,
            userId: data.userId,
            status: "ACTIVE",
            runAsSiteUser: true
          }
        } : undefined
      },
    });

    revalidatePath("/admin/subscriptions");
    return { success: true, data: subscription };
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return { success: false, error: "Failed to create subscription" };
  }
}

export async function getSubscriptions() {
  if (!(await getAdminSession())) return [];
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        plan: { select: { name: true } },
        site: { select: { domain: true } }
      },
    });
    return subscriptions;
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    return [];
  }
}

export async function updateSubscription(
  id: string,
  data: {
    status?: "ACTIVE" | "EXPIRED" | "CANCELLED";
    endDate?: Date;
  }
) {
  if (!(await getAdminSession())) {
    return { success: false, error: "Unauthorized" };
  }
  try {
    const subscription = await prisma.subscription.update({
      where: { id },
      data,
    });
    // Extending an expired subscription brings its site back online
    if (subscription.status === "ACTIVE" && subscription.endDate > new Date()) {
      await resumeSiteIfExpired(subscription.id);
    }
    revalidatePath("/admin/subscriptions");
    return { success: true, data: subscription };
  } catch (error) {
    console.error("Failed to update subscription:", error);
    return { success: false, error: "Failed to update subscription" };
  }
}
