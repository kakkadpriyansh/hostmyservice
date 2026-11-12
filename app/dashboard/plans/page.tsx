import prisma from "@/lib/prisma";
import { CheckoutButton } from "@/components/payment/checkout-button";
import { Check } from "lucide-react";
import { Plan } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
      })
    : null;

  // Fetch active, non-deleted plans (verified)
  const plans = await prisma.plan.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: { price: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-xs font-bold text-white mb-3">
          <span className="w-2 h-2 rounded-full bg-[#00D2FF] animate-pulse" />
          Pricing & Plans
        </span>
        <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">
          Available Hosting Plans
        </h1>
        <p className="mt-2 text-base text-blue-200/70 max-w-2xl">
          Choose the right plan for your application. Every tier includes free automated SSL, DDoS mitigation, and instant deployment.
        </p>
      </div>

      <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan: Plan) => {
          const monthly = Math.round(plan.price / 12);
          const daily = (plan.price / 365).toFixed(2);

          return (
            <div
              key={plan.id}
              className="group relative flex flex-col rounded-2xl sm:rounded-[28px] border border-white/15 bg-[#0A1A4F]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-[#00D2FF]/60 hover:bg-[#0E2262] hover:-translate-y-1"
            >
              <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#00D2FF] uppercase tracking-wider mb-3">
                  Hosting Plan
                </span>
                <h3 className="text-xl sm:text-2xl font-display font-black text-white group-hover:text-[#00D2FF] transition-colors">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-blue-200/70 min-h-[40px] leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-2 flex items-baseline gap-x-1.5">
                <span className="text-4xl sm:text-5xl font-display font-black tracking-tight text-white">
                  ₹{monthly}
                </span>
                <span className="text-sm font-bold text-blue-200/60">
                  / month
                </span>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 text-xs font-bold text-white">
                  Billed ₹{plan.price} yearly
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-[#00D2FF] border border-dashed border-[#00D2FF]/50">
                  ≈ ₹{daily}/day
                </span>
              </div>

              <div className="h-px bg-white/10 mb-8" />

              <ul role="list" className="mb-8 space-y-3.5 text-sm leading-6 text-blue-100 flex-1">
                {(plan.features && plan.features.length > 0
                  ? plan.features
                  : [
                      "Static & Node.js Website Hosting",
                      "Free SSL Certificate",
                      "DDoS Protection",
                      "Dedicated Isolated Database Port",
                      "Priority Support",
                    ]
                ).map((feature, index) => (
                  <li key={index} className="flex gap-x-3 items-center">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00D2FF] text-[#07133B]">
                      <Check className="h-3.5 w-3.5 stroke-[3.5]" aria-hidden="true" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6 border-t border-white/10">
                <CheckoutButton
                  planId={plan.id}
                  planName={plan.name}
                  price={plan.price}
                  price2Years={plan.price2Years}
                  price3Years={plan.price3Years}
                  userProfile={user}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
