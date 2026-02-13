import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      // Check if payment is already processed
      const existingPayment = await prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
        include: { plan: true },
      });

      if (existingPayment && existingPayment.status !== "SUCCESS") {
        // Update Payment
        await prisma.payment.update({
            where: { id: existingPayment.id },
            data: {
                status: "SUCCESS",
                razorpayPaymentId: paymentId,
                razorpaySignature: signature
            }
        });

        // Activate Subscription if not already active
        if (existingPayment.plan) {
             const startDate = new Date();
             const endDate = new Date();
             // If durationYears is set (1, 2, 3), use that, otherwise fall back to plan.duration (days)
             if (existingPayment.durationYears) {
                endDate.setFullYear(startDate.getFullYear() + existingPayment.durationYears);
             } else {
                endDate.setDate(startDate.getDate() + existingPayment.plan.duration);
             }

             await prisma.subscription.create({
               data: {
                 userId: existingPayment.userId,
                 planId: existingPayment.plan.id,
                 startDate,
                 endDate,
                 status: "ACTIVE",
               },
             });
        }
      }
    } else if (event.event === "subscription.charged") {
      const subscriptionEntity = event.payload.subscription.entity;
      const paymentEntity = event.payload.payment.entity;
      
      const razorpaySubscriptionId = subscriptionEntity.id;
      const razorpayPaymentId = paymentEntity.id;
      const notes = subscriptionEntity.notes;
      const userId = notes?.userId;
      const planId = notes?.planId;
      const durationYears = parseInt(notes?.durationYears || "1");

      // Find if we have a pending payment for this subscription
      const existingPayment = await prisma.payment.findFirst({
        where: { 
          OR: [
            { razorpaySubscriptionId: razorpaySubscriptionId },
            { razorpayOrderId: razorpaySubscriptionId }
          ]
        }
      });

      if (existingPayment || (userId && planId)) {
        const pUserId = existingPayment?.userId || userId;
        const pPlanId = (existingPayment?.planId || planId) as string;
        const pDurationYears = existingPayment?.durationYears || durationYears;

        if (existingPayment) {
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: "SUCCESS",
              razorpayPaymentId,
              razorpaySubscriptionId,
            }
          });
        } else {
            // Create a new payment record for recurring charge
            await prisma.payment.create({
                data: {
                    userId: pUserId,
                    planId: pPlanId,
                    amount: paymentEntity.amount / 100,
                    currency: "INR",
                    status: "SUCCESS",
                    razorpayOrderId: razorpaySubscriptionId,
                    razorpayPaymentId,
                    razorpaySubscriptionId,
                    durationYears: pDurationYears,
                }
            });
        }

        // Update or Create Subscription
        const plan = await prisma.plan.findUnique({ where: { id: pPlanId } });
        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setFullYear(startDate.getFullYear() + pDurationYears);

          await prisma.subscription.upsert({
            where: { razorpaySubscriptionId: razorpaySubscriptionId },
            update: {
              status: "ACTIVE",
              endDate: endDate,
            },
            create: {
              userId: pUserId,
              planId: plan.id,
              startDate,
              endDate,
              status: "ACTIVE",
              razorpaySubscriptionId,
              autoRenew: plan.autoRenew,
            }
          });
        }
      }
    } else if (event.event === "subscription.cancelled") {
      const subscriptionEntity = event.payload.subscription.entity;
      const razorpaySubscriptionId = subscriptionEntity.id;

      await prisma.subscription.updateMany({
        where: { razorpaySubscriptionId: razorpaySubscriptionId },
        data: {
          status: "CANCELLED",
          autoRenew: false
        }
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
