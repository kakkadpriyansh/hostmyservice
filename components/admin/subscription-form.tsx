"use client";

import { useState, useEffect } from "react";
import { createSubscription } from "@/app/actions/admin/subscriptions";
import { getUsers } from "@/app/actions/admin/users";
import { getPlans } from "@/app/actions/admin/plans";
import { X } from "lucide-react";

interface SubscriptionFormProps {
  onClose: () => void;
}

export function SubscriptionForm({ onClose }: SubscriptionFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    userId: "",
    planId: "",
    domain: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [usersData, plansData] = await Promise.all([
        getUsers(),
        getPlans(),
      ]);
      setUsers(usersData);
      setPlans(plansData);
    };
    fetchData();
  }, []);

  // Auto-calculate end date when plan changes
  useEffect(() => {
    if (formData.planId && formData.startDate) {
      const selectedPlan = plans.find(p => p.id === formData.planId);
      if (selectedPlan) {
        const start = new Date(formData.startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + selectedPlan.duration);
        setFormData(prev => ({ ...prev, endDate: end.toISOString().split("T")[0] }));
      }
    }
  }, [formData.planId, formData.startDate, plans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createSubscription({
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Assign Hosting Plan</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Client
            </label>
            <select
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={formData.userId}
              onChange={(e) =>
                setFormData({ ...formData, userId: e.target.value })
              }
            >
              <option value="">Select a client...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Plan
            </label>
            <select
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={formData.planId}
              onChange={(e) =>
                setFormData({ ...formData, planId: e.target.value })
              }
            >
              <option value="">Select a plan...</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ₹{plan.price} / {plan.duration} days
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Domain (Optional)
            </label>
            <input
              type="text"
              placeholder="example.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={formData.domain}
              onChange={(e) =>
                setFormData({ ...formData, domain: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Assigning..." : "Assign Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
