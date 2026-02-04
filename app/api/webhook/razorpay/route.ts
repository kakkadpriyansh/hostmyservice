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
             endDate.setDate(startDate.getDate() + existingPayment.plan.duration);

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
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
