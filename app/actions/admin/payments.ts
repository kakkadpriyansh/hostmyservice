"use server";

import { getAdminSession, safeUserSelect } from "@/lib/authz";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { activatePayment } from "@/lib/subscriptions";

export async function getPayments() {
  if (!(await getAdminSession())) {
    return { success: false, error: "Unauthorized" };
  }
  try {
    const payments = await prisma.payment.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: safeUserSelect },
        plan: true,
        subscription: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: payments };
  } catch (error) {
    return { success: false, error: "Failed to fetch payments" };
  }
}

export async function activateSubscription(paymentId: string) {
  if (!(await getAdminSession())) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await activatePayment(paymentId);
    if (!result.activated) {
      return { success: false, error: "Invalid payment or already success" };
    }

    revalidatePath("/admin/payments");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to activate subscription" };
  }
}
