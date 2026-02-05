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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#0A0A0A] border border-white/10 p-6 shadow-2xl glass">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-white">Assign Hosting Plan</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Client
            </label>
            <select
              required
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none"
              value={formData.userId}
              onChange={(e) =>
                setFormData({ ...formData, userId: e.target.value })
              }
            >
              <option value="" className="bg-[#0A0A0A]">Select a client...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id} className="bg-[#0A0A0A]">
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Plan
            </label>
            <select
              required
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none"
              value={formData.planId}
              onChange={(e) =>
                setFormData({ ...formData, planId: e.target.value })
              }
            >
              <option value="" className="bg-[#0A0A0A]">Select a plan...</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id} className="bg-[#0A0A0A]">
                  {plan.name} - ₹{plan.price} / {plan.duration} days
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Domain (Optional)
            </label>
            <input
              type="text"
              placeholder="example.com"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              value={formData.domain}
              onChange={(e) =>
                setFormData({ ...formData, domain: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-6 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all disabled:opacity-50"
            >
              {loading ? "Assigning..." : "Assign Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
