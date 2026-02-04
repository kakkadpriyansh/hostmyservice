"use client";

import { useState, useEffect } from "react";
import { getSubscriptions } from "@/app/actions/admin/subscriptions";
import { SubscriptionForm } from "@/components/admin/subscription-form";
import { Plus, Calendar, Globe } from "lucide-react";

type Subscription = {
  id: string;
  user: { name: string | null; email: string };
  plan: { name: string };
  domain: string | null;
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
        <h1 className="text-2xl font-bold">Hosting Assignments</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Assign Plan
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Domain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Validity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {subscriptions.map((sub) => (
              <tr key={sub.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {sub.user.name}
                  </div>
                  <div className="text-sm text-gray-500">{sub.user.email}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {sub.plan.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {sub.domain ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Globe className="h-4 w-4" />
                      {sub.domain}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <div>{new Date(sub.startDate).toLocaleDateString()}</div>
                      <div className="text-xs">
                        to {new Date(sub.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      sub.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : sub.status === "EXPIRED"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
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
