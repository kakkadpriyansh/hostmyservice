import prisma from "@/lib/prisma";
import { resumeSiteIfExpired } from "@/lib/site-control";
import { recordCommissionForPayment } from "@/lib/affiliate";

/**
 * Plan prices are yearly, so a subscription lasts `durationYears` years
 * (1, 2 or 3) from activation.
 */
export function subscriptionEndDate(startDate: Date, durationYears: number): Date {
  const years = [1, 2, 3].includes(durationYears) ? durationYears : 1;
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + years);
  return endDate;
}

type ActivationResult =
  | { activated: true; subscriptionId: string | null }
  | { activated: false; reason: "not_found" | "already_processed" };

/**
 * Marks a PENDING payment as SUCCESS and creates (or renews) its subscription.
 *
 * Idempotent: the PENDING -> SUCCESS transition is a conditional update inside a
 * transaction, so when checkout verification, the Razorpay webhook and admin
 * "Force Activate" race or are replayed, exactly one of them creates the
 * subscription and the rest get `already_processed`.
 */
export async function activatePayment(
  paymentId: string,
  details: { razorpayPaymentId?: string; razorpaySignature?: string } = {}
): Promise<ActivationResult> {
  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: { not: "SUCCESS" } },
      data: {
        status: "SUCCESS",
        ...(details.razorpayPaymentId ? { razorpayPaymentId: details.razorpayPaymentId } : {}),
        ...(details.razorpaySignature ? { razorpaySignature: details.razorpaySignature } : {}),
      },
    });

    if (claimed.count === 0) {
      const exists = await tx.payment.findUnique({ where: { id: paymentId }, select: { id: true } });
      return { activated: false, reason: exists ? "already_processed" : "not_found" } as const;
    }

    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: { plan: true },
    });

    if (!payment.plan) {
      await recordCommissionForPayment(tx, payment.id);
      return { activated: true, subscriptionId: null } as const;
    }

    const startDate = new Date();
    const endDate = subscriptionEndDate(startDate, payment.durationYears);

    let subscriptionId: string;
    if (payment.subscriptionId) {
      // Payment was created for an existing subscription: renew it
      const sub = await tx.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: "ACTIVE", startDate, endDate },
      });
      subscriptionId = sub.id;
    } else if (payment.razorpaySubscriptionId) {
      // Razorpay auto-renew subscription: one Subscription row per Razorpay subscription
      const sub = await tx.subscription.upsert({
        where: { razorpaySubscriptionId: payment.razorpaySubscriptionId },
        update: { status: "ACTIVE", endDate },
        create: {
          userId: payment.userId,
          planId: payment.plan.id,
          startDate,
          endDate,
          status: "ACTIVE",
          razorpaySubscriptionId: payment.razorpaySubscriptionId,
          autoRenew: payment.plan.autoRenew,
        },
      });
      subscriptionId = sub.id;
    } else {
      const sub = await tx.subscription.create({
        data: {
          userId: payment.userId,
          planId: payment.plan.id,
          startDate,
          endDate,
          status: "ACTIVE",
        },
      });
      subscriptionId = sub.id;
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { subscriptionId },
    });

    // Referral commission, in the same transaction as the payment
    await recordCommissionForPayment(tx, payment.id);

    return { activated: true, subscriptionId } as const;
  });

  // A renewal brings back a site that was suspended because it expired
  if (result.activated && result.subscriptionId) {
    await resumeSiteIfExpired(result.subscriptionId);
  }

  return result;
}
