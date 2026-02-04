"use client";

import { useState } from "react";
import { createSubscriptionOrder, verifyPayment } from "@/app/actions/payment";
import { useRouter } from "next/navigation";
import Script from "next/script";

interface CheckoutButtonProps {
  planId: string;
  amount: number;
  currency?: string;
}

export function CheckoutButton({ planId, amount, currency = "INR" }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Create Order
      const order = await createSubscriptionOrder(planId);

      // 2. Initialize Razorpay
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "HostMyService",
        description: "Hosting Subscription",
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            alert("Payment Successful! Subscription activated.");
            router.push("/dashboard");
            router.refresh();
          } catch (error) {
            console.error("Verification failed", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        theme: {
          color: "#2563eb", // blue-600
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        alert("Payment Failed: " + response.error.description);
      });
      rzp1.open();

    } catch (error) {
      console.error("Payment failed", error);
      alert("Failed to initiate payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <button
        onClick={handlePayment}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Processing..." : `Subscribe for ${currency} ${amount}`}
      </button>
    </>
  );
}
