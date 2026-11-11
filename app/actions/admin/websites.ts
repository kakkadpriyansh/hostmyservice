"use server";

import { getAdminSession, safeUserSelect } from "@/lib/authz";
import { suspendSite, resumeSite } from "@/lib/site-control";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hostnameSchema, domainSchema } from "@/lib/validations";

const updateSiteSchema = z.object({
  siteId: z.string().cuid(),
  // Edits may keep an existing domain that predates the stricter rule
  domain: domainSchema,
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]),
  sslStatus: z.enum(["NONE", "PENDING", "ACTIVE", "FAILED"]),
  serverIp: z.ipv4().or(z.literal("")),
  serverPath: z.string().regex(/^(\/[A-Za-z0-9._-]+)*\/?$/, "Invalid server path").or(z.literal("")),
  dbConnection: z.string().max(500),
});

const createWebsiteSchema = z.object({
  userId: z.string().min(1, "User is required"),
  domain: hostnameSchema,
  planId: z.string().min(1, "Plan is required"),
});

export async function getWebsites() {
  if (!(await getAdminSession())) {
    return { success: false, error: "Unauthorized" };
  }
  try {
    const sites = await prisma.site.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: safeUserSelect },
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

export async function getWebsiteById(id: string) {
  if (!(await getAdminSession())) {
    return { success: false, error: "Unauthorized" };
  }
  try {
    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        user: { select: safeUserSelect },
        subscription: {
          include: {
            plan: true
          }
        },
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
    
    if (!site) return { success: false, error: "Website not found" };
    
    return { success: true, data: site };
  } catch (error) {
    return { success: false, error: "Failed to fetch website" };
  }
}

export async function createWebsite(formData: FormData) {
  if (!(await getAdminSession())) {
    return { success: false, error: "Unauthorized" };
  }
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
        status: "ACTIVE",
        runAsSiteUser: true
      }
    });

    revalidatePath("/admin/websites");
    return { success: true, message: "Website created successfully" };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Invalid input" };
    }
    console.error("Failed to create website:", error);
    return { success: false, error: "Failed to create website" };
  }
}

export async function toggleSiteStatus(siteId: string, status: "ACTIVE" | "SUSPENDED") {
  if (!(await getAdminSession())) {
    return { success: false, error: "Unauthorized" };
  }
  try {
    // Updates the database AND stops/starts the site on the server
    if (status === "SUSPENDED") {
      await suspendSite(siteId, "ADMIN");
    } else {
      await resumeSite(siteId);
    }
    revalidatePath("/admin/websites");
    return { success: true };
  } catch (error) {
    console.error("Failed to change site status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function updateSiteDetails(formData: FormData) {
  if (!(await getAdminSession())) {
    return { success: false, error: "Unauthorized" };
  }
  try {
    const parsed = updateSiteSchema.safeParse({
      siteId: formData.get("siteId"),
      domain: formData.get("domain"),
      status: formData.get("status"),
      sslStatus: formData.get("sslStatus"),
      serverIp: formData.get("serverIp") || "",
      serverPath: formData.get("serverPath") || "",
      dbConnection: formData.get("dbConnection") || "",
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }
    const { siteId, domain, status, sslStatus, serverIp, serverPath, dbConnection } = parsed.data;

    await prisma.site.update({
      where: { id: siteId },
      data: {
        domain,
        status,
        sslStatus,
        serverIp: serverIp || null,
        serverPath: serverPath || null,
        dbConnection: dbConnection || null,
      }
    });
    
    revalidatePath("/admin/websites");
    return { success: true, message: "Site details updated successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update site details" };
  }
}

export async function updateServerIp(siteId: string, serverIp: string | null) {
  if (!(await getAdminSession())) {
    return { success: false, error: "Unauthorized" };
  }
  try {
    // Basic validation for IP (IPv4)
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (serverIp && !ipRegex.test(serverIp)) {
       return { success: false, error: "Invalid IP address format" };
    }

    await prisma.site.update({
      where: { id: siteId },
      data: { serverIp: serverIp || null } // Allow clearing IP by passing empty string
    });
    
    revalidatePath("/admin/websites");
    return { success: true };
  } catch (error) {
    console.error("Failed to update server IP:", error);
    return { success: false, error: "Failed to update server IP" };
  }
}
