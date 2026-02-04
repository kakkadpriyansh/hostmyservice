"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { planSchema } from "@/lib/validations";

export async function createPlan(data: {
  name: string;
  price: number;
  duration: number;
  description?: string;
}) {
  const validation = planSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        price: data.price,
        duration: data.duration,
        description: data.description,
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
    duration?: number;
    description?: string;
  }
) {
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
  try {
    await prisma.plan.delete({
      where: { id },
    });
    revalidatePath("/admin/plans");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete plan:", error);
    return { success: false, error: "Failed to delete plan" };
  }
}

export async function getPlans() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: "desc" },
    });
    return plans;
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return [];
  }
}
