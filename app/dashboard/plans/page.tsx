import prisma from "@/lib/prisma";
import { CheckoutButton } from "@/components/payment/checkout-button";
import { Check } from "lucide-react";
import { Plan } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user?.id ? await prisma.user.findUnique({
    where: { id: session.user.id }
  }) : null;

  // Fetch active, non-deleted plans (verified)
  const plans = await prisma.plan.findMany({
    where: { 
      isActive: true,
      deletedAt: null
    },
    orderBy: { price: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Available Hosting Plans</h1>
        <p className="mt-2 text-sm text-gray-400">
          Choose a plan that suits your needs. All plans include free SSL and DDoS protection.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2">
        {plans.map((plan: Plan) => (
          <div
            key={plan.id}
            className="group relative flex flex-col rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 hover:bg-white/10"
          >
             <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-3xl" />
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-400 h-10">{plan.description}</p>
            </div>
            
            <div className="mb-2 flex items-baseline gap-x-1">
              <span className="text-5xl font-display font-bold tracking-tight text-white">
                ₹{Math.round(plan.price / 12)}
              </span>
              <span className="text-sm font-semibold text-gray-400">
                / month
              </span>
            </div>
            <p className="mb-8 text-xs text-gray-500">
              Billed ₹{plan.price} yearly
            </p>

            <ul role="list" className="mb-8 space-y-4 text-sm leading-6 text-gray-300 flex-1">
              {(plan.features && plan.features.length > 0 ? plan.features : [
                "Static Website Hosting",
                "Free SSL Certificate", 
                "DDoS Protection",
                "Priority Support"
              ]).map((feature, index) => (
                <li key={index} className="flex gap-x-3 items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  {feature}
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
        ))}
      </div>
    </div>
  );
}