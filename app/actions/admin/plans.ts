"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { planSchema } from "@/lib/validations";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createPlan(data: {
  name: string;
  price: number;
  price2Years?: number;
  price3Years?: number;
  duration: number;
  description?: string;
  features: string[];
  requiresEnv?: boolean;
  providesDb?: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const validation = planSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        price: data.price,
        price2Years: data.price2Years,
        price3Years: data.price3Years,
        duration: data.duration,
        description: data.description,
        features: data.features,
        requiresEnv: !!data.requiresEnv,
        providesDb: !!data.providesDb,
      },
    });
    revalidatePath("/admin/plans");
    return { success: true, data: plan };
  } catch (error) {
    console.error("Failed to create plan:", error);
    return { success: false, error: "Failed to create plan" };
  }
}

export async function updatePlan(
  id: string,
  data: {
    name?: string;
    price?: number;
    price2Years?: number;
    price3Years?: number;
    duration?: number;
    description?: string;
    features?: string[];
    requiresEnv?: boolean;
    providesDb?: boolean;
  }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const plan = await prisma.plan.update({
      where: { id },
      data,
    });
    revalidatePath("/admin/plans");
    return { success: true, data: plan };
  } catch (error) {
    console.error("Failed to update plan:", error);
    return { success: false, error: "Failed to update plan" };
  }
}

export async function togglePlanStatus(id: string, isActive: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const plan = await prisma.plan.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath("/admin/plans");
    return { success: true, data: plan };
  } catch (error) {
    console.error("Failed to toggle plan status:", error);
    return { success: false, error: "Failed to toggle plan status" };
  }
}

export async function deletePlan(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.plan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/admin/plans");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete plan:", error);
    return { success: false, error: "Failed to delete plan" };
  }
}

export async function clonePlan(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    const { id: _, createdAt, updatedAt, deletedAt, ...planData } = plan;

    await prisma.plan.create({
      data: {
        ...planData,
        name: `${planData.name} (Copy)`,
      },
    });

    revalidatePath("/admin/plans");
    return { success: true };
  } catch (error) {
    console.error("Failed to clone plan:", error);
    return { success: false, error: "Failed to clone plan" };
  }
}

export async function getPlans() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return [];
  }

  try {
    const plans = await prisma.plan.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return plans;
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return [];
  }
}
