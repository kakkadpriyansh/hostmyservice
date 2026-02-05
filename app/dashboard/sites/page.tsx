"use client";

import { useEffect, useState } from "react";
import { getClientSubscriptions } from "@/app/actions/client/dashboard";
import { SiteCard } from "@/components/dashboard/site-card";
import { Server } from "lucide-react";
import { SubscriptionWithPlan } from "@/types";

export default function MySitesPage() {
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">My Hosted Sites</h1>
        <p className="mt-2 text-sm text-gray-400">
          Manage your active hosting subscriptions and domain settings.
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-center backdrop-blur-sm glass">
          <div className="rounded-full bg-white/10 p-4 mb-4">
            <Server className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-white">
            No active subscriptions
          </h3>
          <p className="mt-2 text-sm text-gray-400 max-w-sm">
            You haven't subscribed to any hosting plans yet. Choose a plan to start deploying your sites.
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
