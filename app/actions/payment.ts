"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import crypto from "crypto";
import { env } from "@/lib/env";
import { planIdSchema, paymentVerificationSchema } from "@/lib/validations";

export async function createSubscriptionOrder(planId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
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

  // Amount in paisa
  const amount = Math.round(plan.price * 100);

  try {
    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      // Receipt id must be <= 40 chars
      receipt: `rcpt_${Date.now()}_${session.user.id.slice(-8)}`,
      notes: {
        userId: session.user.id,
        planId: plan.id,
      },
    });

    // Create Payment Record
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        amount: plan.price,
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
    endDate.setDate(startDate.getDate() + payment.plan.duration);

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
