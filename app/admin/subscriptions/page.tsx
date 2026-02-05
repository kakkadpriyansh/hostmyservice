"use client";

import { useState, useEffect } from "react";
import { getSubscriptions } from "@/app/actions/admin/subscriptions";
import { SubscriptionForm } from "@/components/admin/subscription-form";
import { Plus, Calendar, Globe } from "lucide-react";

type Subscription = {
  id: string;
  user: { name: string | null; email: string };
  plan: { name: string };
  site?: { domain: string } | null;
  startDate: Date;
  endDate: Date;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSubscriptions = async () => {
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    if (!isFormOpen) {
      loadSubscriptions();
    }
  }, [isFormOpen]);

  if (loading) return <div>Loading subscriptions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-white">Hosting Assignments</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-black transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]"
        >
          <Plus className="h-4 w-4" />
          Assign Plan
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 glass">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Domain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Validity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-white">
                    {sub.user.name}
                  </div>
                  <div className="text-sm text-gray-400">{sub.user.email}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                  {sub.plan.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {sub.site?.domain ? (
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Globe className="h-4 w-4 text-primary" />
                      {sub.site.domain}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <div>{new Date(sub.startDate).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">
                        to {new Date(sub.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${
                      sub.status === "ACTIVE"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : sub.status === "EXPIRED"
                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {sub.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && <SubscriptionForm onClose={() => setIsFormOpen(false)} />}
    </div>
  );
}
