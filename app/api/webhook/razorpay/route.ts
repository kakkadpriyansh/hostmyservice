import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { activatePayment, subscriptionEndDate } from "@/lib/subscriptions";
import { resumeSiteIfExpired } from "@/lib/site-control";
import { recordCommissionForPayment } from "@/lib/affiliate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Razorpay signs webhooks with the secret set in Dashboard → Webhooks,
    // which is separate from the API key secret.
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (!safeEqual(expectedSignature, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const existingPayment = orderId
        ? await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } })
        : null;

      // activatePayment is idempotent, so a payment already verified at
      // checkout (or a redelivered webhook) does nothing here
      if (existingPayment) {
        await activatePayment(existingPayment.id, { razorpayPaymentId: paymentId });
      }
    } else if (event.event === "subscription.charged") {
      const subscriptionEntity = event.payload.subscription.entity;
      const paymentEntity = event.payload.payment.entity;

      const razorpaySubscriptionId: string = subscriptionEntity.id;
      const razorpayPaymentId: string = paymentEntity.id;

      // Redelivered webhook for a charge we already recorded
      const alreadyRecorded = await prisma.payment.findUnique({
        where: { razorpayPaymentId },
        select: { id: true },
      });
      if (alreadyRecorded) {
        return NextResponse.json({ status: "ok" });
      }

      // First charge: the PENDING payment created at checkout
      const pendingPayment = await prisma.payment.findFirst({
        where: {
          status: "PENDING",
          OR: [
            { razorpaySubscriptionId },
            { razorpayOrderId: razorpaySubscriptionId },
          ],
        },
      });

      if (pendingPayment) {
        await activatePayment(pendingPayment.id, { razorpayPaymentId });
        return NextResponse.json({ status: "ok" });
      }

      // Recurring charge: record a new payment and extend the subscription
      const subscription = await prisma.subscription.findUnique({
        where: { razorpaySubscriptionId },
      });
      const previousPayment = await prisma.payment.findFirst({
        where: { razorpaySubscriptionId },
        orderBy: { createdAt: "desc" },
      });
      const notes = subscriptionEntity.notes || {};
      const userId: string | undefined = subscription?.userId || previousPayment?.userId || notes.userId;
      const planId: string | undefined = subscription?.planId || previousPayment?.planId || notes.planId;
      const durationYears = previousPayment?.durationYears || parseInt(notes.durationYears || "1", 10) || 1;

      if (!userId || !planId) {
        console.error(`subscription.charged for unknown subscription ${razorpaySubscriptionId}`);
        return NextResponse.json({ status: "ignored" });
      }

      // Extend from the current end date if still active, otherwise from now
      const now = new Date();
      const base = subscription && subscription.endDate > now ? subscription.endDate : now;
      const endDate = subscriptionEndDate(base, durationYears);

      const renewed = await prisma.$transaction(async (tx) => {
        const sub = await tx.subscription.upsert({
          where: { razorpaySubscriptionId },
          update: { status: "ACTIVE", endDate },
          create: {
            userId,
            planId,
            startDate: now,
            endDate,
            status: "ACTIVE",
            razorpaySubscriptionId,
            autoRenew: true,
          },
        });

        const renewalPayment = await tx.payment.create({
          data: {
            userId,
            planId,
            subscriptionId: sub.id,
            amount: paymentEntity.amount / 100,
            currency: "INR",
            status: "SUCCESS",
            razorpayPaymentId,
            razorpaySubscriptionId,
            durationYears,
          },
        });

        // Referral commission on renewals (only if the program pays on all payments)
        await recordCommissionForPayment(tx, renewalPayment.id);

        return sub;
      });

      // Renewal brings back a site that was suspended for expiry
      await resumeSiteIfExpired(renewed.id);
    } else if (event.event === "subscription.cancelled") {
      const subscriptionEntity = event.payload.subscription.entity;
      const razorpaySubscriptionId = subscriptionEntity.id;

      // Cancelling stops renewal; access continues until endDate
      await prisma.subscription.updateMany({
        where: { razorpaySubscriptionId: razorpaySubscriptionId },
        data: {
          status: "CANCELLED",
          autoRenew: false,
        },
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
