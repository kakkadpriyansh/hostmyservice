"use client";

import { useState, useEffect } from "react";
import { createSubscriptionOrder, verifyPayment } from "@/app/actions/payment";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { BillingForm } from "./billing-form";

interface CheckoutButtonProps {
  planId: string;
  planName: string;
  price: number;
  price2Years?: number | null;
  price3Years?: number | null;
  userProfile?: any; // Using any to avoid complex type imports, but ideally should be User type
}

export function CheckoutButton({ planId, planName, price, price2Years, price3Years, userProfile }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [durationYears, setDurationYears] = useState(1);
  const router = useRouter();

  useEffect(() => {
    if (userProfile) {
      const isComplete = 
        userProfile.phoneNumber &&
        userProfile.address &&
        userProfile.city &&
        userProfile.state &&
        userProfile.postalCode &&
        userProfile.country;
      setIsProfileComplete(!!isComplete);
    }
  }, [userProfile]);

  const getPrice = (years: number) => {
    if (years === 2 && price2Years) return price2Years;
    if (years === 3 && price3Years) return price3Years;
    return price * years;
  };

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
      const order = await createSubscriptionOrder(planId, durationYears);
      
      if (!order || !order.key) {
         throw new Error("Failed to create order");
      }

      // 2. Initialize Razorpay
      const options: any = {
        key: order.key,
        name: "HostMyService",
        description: `Subscription for ${planName} (${durationYears} Year${durationYears > 1 ? 's' : ''})`,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            // For subscriptions, we might need to send different data to verify
            const verifyData = order.isSubscription 
              ? {
                  razorpayOrderId: response.razorpay_subscription_id, // Use subscription ID
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }
              : {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                };

            await verifyPayment(
              verifyData.razorpayOrderId,
              verifyData.razorpayPaymentId,
              verifyData.razorpaySignature
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
          email: userProfile?.email,
          contact: userProfile?.phoneNumber
        },
        theme: {
          color: "#00f0ff", // cyan-500
        },
      };

      if (order.isSubscription) {
        options.subscription_id = order.subscriptionId;
      } else {
        options.amount = order.amount;
        options.currency = order.currency;
        options.order_id = order.orderId;
      }

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment failed", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = () => {
    if (!isProfileComplete) {
      setShowBillingModal(true);
    } else {
      handlePayment();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
        {[1, 2, 3].map((yr) => (
          <button
            key={yr}
            onClick={() => setDurationYears(yr)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
              durationYears === yr 
                ? "bg-[#00f0ff] text-black shadow-[0_0_15px_rgba(0,240,255,0.3)]" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {yr} Yr
          </button>
        ))}
      </div>

      <button
        onClick={handleBuyClick}
        disabled={loading}
        className="w-full rounded-xl bg-[#00f0ff] px-4 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:bg-[#00f0ff]/90 hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Buy ${planName} - ₹${getPrice(durationYears)}`
        )}
      </button>

      {showBillingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-2xl">
            <button
              onClick={() => setShowBillingModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <BillingForm
              initialData={userProfile}
              onSuccess={() => {
                setIsProfileComplete(true);
                setShowBillingModal(false);
                handlePayment();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
