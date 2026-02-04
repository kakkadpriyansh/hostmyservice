import prisma from "@/lib/prisma";
import { CheckoutButton } from "@/components/payment/checkout-button";
import { Check } from "lucide-react";
import { Plan } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Available Hosting Plans</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose a plan that suits your needs. All plans include free SSL and DDoS protection.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2">
        {plans.map((plan: Plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
            </div>
            
            <div className="mb-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900">
                ₹{plan.price}
              </span>
              <span className="text-sm font-semibold text-gray-600">
                / {plan.duration} days
              </span>
            </div>

            <ul role="list" className="mb-8 space-y-3 text-sm leading-6 text-gray-600">
              <li className="flex gap-x-3">
                <Check className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Static Website Hosting
              </li>
              <li className="flex gap-x-3">
                <Check className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Free SSL Certificate
              </li>
              <li className="flex gap-x-3">
                <Check className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                99.9% Uptime
              </li>
            </ul>

            <div className="mt-auto">
              <CheckoutButton 
                planId={plan.id} 
                planName={plan.name} 
                price={plan.price} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
