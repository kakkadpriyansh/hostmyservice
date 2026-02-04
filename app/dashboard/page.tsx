"use client";

import { useEffect, useState } from "react";
import { getClientSubscriptions } from "@/app/actions/client/dashboard";
import { SiteCard } from "@/components/dashboard/site-card";
import { AlertCircle } from "lucide-react";
import { SubscriptionWithPlan } from "@/types";

export default function ClientDashboard() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const data = await getClientSubscriptions();
        setSubscriptions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Hosted Sites</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your active hosting subscriptions and domain settings.
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center">
          <div className="rounded-full bg-gray-100 p-3">
            <AlertCircle className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            No active subscriptions
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Contact an administrator to get a hosting plan assigned.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {subscriptions.map((sub) => (
            <SiteCard key={sub.id} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
