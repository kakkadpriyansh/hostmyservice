"use client";

import { useState } from "react";
import { createSubscriptionOrder, verifyPayment } from "@/app/actions/payment";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CheckoutButtonProps {
  planId: string;
  planName: string;
  price: number;
}

export function CheckoutButton({ planId, planName, price }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      const res = await loadRazorpay();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        return;
      }

      // 1. Create Order
      const order = await createSubscriptionOrder(planId);

      // 2. Initialize Razorpay
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "HostMyService",
        description: `Subscription for ${planName}`,
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            alert("Payment Successful! Subscription Active.");
            router.push("/dashboard");
            router.refresh();
          } catch (error) {
            console.error("Verification failed", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          // You can prefill user details if you have them in context
          // email: user.email,
          // contact: user.phone
        },
        theme: {
          color: "#00f0ff", // cyan-500
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment failed", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full rounded-xl bg-[#00f0ff] px-4 py-2 text-sm font-bold text-black shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:bg-[#00f0ff]/90 hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Buy ${planName} - ₹${price}`
      )}
    </button>
  );
}
