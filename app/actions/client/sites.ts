"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const domainSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, "Invalid domain format");

export async function createSite(subscriptionId: string, domain: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validation = domainSchema.safeParse(domain);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    // 1. Check if subscription belongs to user
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { site: true }
    });

    if (!subscription) {
      return { success: false, error: "Subscription not found" };
    }

    if (subscription.userId !== session.user.id) {
      return { success: false, error: "Unauthorized access to subscription" };
    }

    if (subscription.site) {
      return { success: false, error: "Subscription already has a site assigned" };
    }

    // 2. Check if domain is taken
    const existingSite = await prisma.site.findUnique({
      where: { domain }
    });

    if (existingSite) {
      return { success: false, error: "Domain is already registered" };
    }

    // 3. Create Site
    await prisma.site.create({
      data: {
        domain,
        userId: session.user.id,
        subscriptionId,
        status: "ACTIVE",
        sslStatus: "NONE"
      }
    });

    revalidatePath("/dashboard/sites");
    return { success: true };
  } catch (error) {
    console.error("Failed to create site:", error);
    return { success: false, error: "Failed to create site" };
  }
}

export async function saveEnvVars(siteId: string, envContent: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Basic size limit and sanitation: allow any text, but cap length
  if (typeof envContent !== "string" || envContent.length > 100_000) {
    return { success: false, error: "Environment content too large" };
  }

  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { userId: true },
    });
    if (!site || site.userId !== session.user.id) {
      return { success: false, error: "Unauthorized access to site" };
    }

    await prisma.site.update({
      where: { id: siteId },
      data: { envVars: envContent },
    });

    revalidatePath("/dashboard/sites");
    return { success: true };
  } catch (error) {
    console.error("Failed to save env vars:", error);
    return { success: false, error: "Failed to save env vars" };
  }
}
