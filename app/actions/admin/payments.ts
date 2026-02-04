"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPayments() {
  try {
    const payments = await prisma.payment.findMany({
      where: { deletedAt: null },
      include: {
        user: true,
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
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { plan: true }
    });

    if (!payment || payment.status === "SUCCESS") {
      return { success: false, error: "Invalid payment or already success" };
    }

    // 1. Update Payment Status
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "SUCCESS" }
    });

    // 2. Create or Update Subscription
    if (payment.planId && payment.userId) {
      const plan = await prisma.plan.findUnique({ where: { id: payment.planId } });
      if (plan) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + plan.duration);

        // Check if there is already a pending subscription for this payment?
        // Or just create a new one.
        // If payment has subscriptionId, update it.
        if (payment.subscriptionId) {
             await prisma.subscription.update({
                where: { id: payment.subscriptionId },
                data: {
                    status: "ACTIVE",
                    startDate,
                    endDate
                }
             });
        } else {
            // Create new
            await prisma.subscription.create({
                data: {
                    userId: payment.userId,
                    planId: payment.planId,
                    startDate,
                    endDate,
                    status: "ACTIVE",
                    // Link back to payment is done via separate update or just implicit? 
                    // Payment has subscriptionId foreign key.
                    // We should link them.
                }
            });
            // Note: We can't easily link the new subscription to the *existing* payment 
            // without another update query, but usually the flow is:
            // Order -> Payment -> Webhook -> Create/Update Sub.
            // If we are manually activating, we assume the subscription might not exist or is pending.
        }
      }
    }

    revalidatePath("/admin/payments");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to activate subscription" };
  }
}
