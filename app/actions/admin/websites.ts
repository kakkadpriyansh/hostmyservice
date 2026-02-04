"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createWebsiteSchema = z.object({
  userId: z.string().min(1, "User is required"),
  domain: z.string().regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
  planId: z.string().min(1, "Plan is required"),
});

export async function getWebsites() {
  try {
    const sites = await prisma.site.findMany({
      where: { deletedAt: null },
      include: {
        user: true,
        subscription: {
          include: {
            plan: true
          }
        },
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: sites };
  } catch (error) {
    return { success: false, error: "Failed to fetch websites" };
  }
}

export async function createWebsite(formData: FormData) {
  try {
    const rawData = {
      userId: formData.get("userId"),
      domain: formData.get("domain"),
      planId: formData.get("planId"),
    };

    const validated = createWebsiteSchema.parse(rawData);

    // Check if domain exists
    const existing = await prisma.site.findUnique({
      where: { domain: validated.domain }
    });

    if (existing) {
      return { success: false, error: "Domain already exists" };
    }

    // Create Subscription first
    const plan = await prisma.plan.findUnique({ where: { id: validated.planId } });
    if (!plan) return { success: false, error: "Plan not found" };

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration);

    const subscription = await prisma.subscription.create({
      data: {
        userId: validated.userId,
        planId: validated.planId,
        startDate,
        endDate,
        status: "ACTIVE"
      }
    });

    // Create Site
    await prisma.site.create({
      data: {
        userId: validated.userId,
        domain: validated.domain,
        subscriptionId: subscription.id,
        status: "ACTIVE"
      }
    });

    revalidatePath("/admin/websites");
    return { success: true, message: "Website created successfully" };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create website" };
  }
}

export async function toggleSiteStatus(siteId: string, status: "ACTIVE" | "SUSPENDED") {
  try {
    await prisma.site.update({
      where: { id: siteId },
      data: { status }
    });
    revalidatePath("/admin/websites");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update status" };
  }
}
