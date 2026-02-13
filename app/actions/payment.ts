"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import crypto from "crypto";
import { env } from "@/lib/env";
import { planIdSchema, paymentVerificationSchema } from "@/lib/validations";

export async function createSubscriptionOrder(planId: string, durationYears: number = 1) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (![1, 2, 3].includes(durationYears)) {
    throw new Error("Invalid duration. Must be 1, 2, or 3 years.");
  }

  // Verify user exists in database to prevent FK constraint errors
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    throw new Error("User account not found. Please log out and log in again.");
  }

  const planIdResult = planIdSchema.safeParse(planId);
  if (!planIdResult.success) {
    throw new Error("Invalid Plan ID");
  }

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  // Calculate price based on duration and optional dynamic pricing
  let finalPrice = plan.price * durationYears;

  if (durationYears === 2 && plan.price2Years) {
    finalPrice = plan.price2Years;
  } else if (durationYears === 3 && plan.price3Years) {
    finalPrice = plan.price3Years;
  }

  // Amount in paisa
  const amount = Math.round(finalPrice * 100);

  try {
    if (plan.autoRenew && plan.autoRenewPlanId) {
      // Create Razorpay Subscription
      const subscription = await razorpay.subscriptions.create({
        plan_id: plan.autoRenewPlanId,
        total_count: 12 * 10, // Max 10 years for now, can be adjusted
        quantity: 1,
        customer_notify: 1,
        notes: {
          userId: session.user.id,
          planId: plan.id,
          durationYears,
        },
      });

      // Create Payment Record (for tracking)
      await prisma.payment.create({
        data: {
          userId: session.user.id,
          planId: plan.id,
          amount: finalPrice,
          durationYears: durationYears,
          currency: "INR",
          status: "PENDING",
          razorpayOrderId: subscription.id, // Store subscription ID here for verification
          razorpaySubscriptionId: subscription.id,
        },
      });

      return {
        subscriptionId: subscription.id,
        amount: amount,
        currency: "INR",
        key: env.RAZORPAY_KEY_ID,
        isSubscription: true,
      };
    }

    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      // Receipt id must be <= 40 chars
      receipt: `rcpt_${Date.now()}_${session.user.id.slice(-8)}`,
      notes: {
        userId: session.user.id,
        planId: plan.id,
        durationYears,
      },
    });

    // Create Payment Record
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        amount: finalPrice,
        durationYears: durationYears,
        currency: "INR",
        status: "PENDING",
        razorpayOrderId: order.id,
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: env.RAZORPAY_KEY_ID,
    };
  } catch (error) {
    console.error("Razorpay Order Creation Failed:", error);
    throw new Error("Failed to create payment order");
  }
}

export async function verifyPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  // Validate Inputs
  const result = paymentVerificationSchema.safeParse({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!result.success) {
    throw new Error("Invalid payment data");
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // 1. Verify Signature
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    throw new Error("Invalid payment signature");
  }

  // 2. Update Payment Status
  const payment = await prisma.payment.update({
    where: { razorpayOrderId },
    data: {
      status: "SUCCESS",
      razorpayPaymentId,
      razorpaySignature,
    },
    include: { plan: true },
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  // 3. Activate Subscription
  if (payment.plan) {
    const startDate = new Date();
    const endDate = new Date();
    // Use durationYears from payment if available, otherwise default to 1 year
    const durationYears = payment.durationYears || 1;
    endDate.setDate(startDate.getDate() + (durationYears * 365));

    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        planId: payment.plan.id,
        startDate,
        endDate,
        status: "ACTIVE",
      },
    });
  }

  return { success: true };
}
