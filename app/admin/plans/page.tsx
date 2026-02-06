"use client";

import { useState } from "react";
import { getPlans, togglePlanStatus, deletePlan, clonePlan } from "@/app/actions/admin/plans";
import { PlanForm } from "@/components/admin/plan-form";
import { Plus, Pencil, Power, PowerOff, Trash, Copy } from "lucide-react";
import { useEffect } from "react";

type Plan = {
  id: string;
  name: string;
  price: number;
  price2Years?: number | null;
  price3Years?: number | null;
  duration: number;
  description: string | null;
  features?: string[];
  isActive: boolean;
  requiresEnv?: boolean;
  providesDb?: boolean;
  createdAt: Date;
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    try {
      const data = await getPlans();
      setPlans(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // Refresh list when form closes (simple way to keep sync)
  useEffect(() => {
    if (!isFormOpen) {
      loadPlans();
    }
  }, [isFormOpen]);

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingPlan(undefined);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (plan: Plan) => {
    try {
      await togglePlanStatus(plan.id, !plan.isActive);
      loadPlans();
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this plan?")) {
      try {
        await deletePlan(id);
        loadPlans();
      } catch (error) {
        console.error("Failed to delete plan:", error);
      }
    }
  };

  const handleClone = async (id: string) => {
    try {
      await clonePlan(id);
      loadPlans();
    } catch (error) {
      console.error("Failed to clone plan:", error);
    }
  };

  if (loading) return <div>Loading plans...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-white">Hosting Plans</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-black transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 glass">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-white/5 transition-colors">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-white">
                    {plan.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {plan.description}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                  ₹{plan.price}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                  {plan.duration} days
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${
                      plan.isActive
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="text-primary hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleClone(plan.id)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Clone"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(plan)}
                      className={`${
                        plan.isActive
                          ? "text-yellow-400 hover:text-yellow-300"
                          : "text-green-400 hover:text-green-300"
                      } transition-colors`}
                      title={plan.isActive ? "Disable" : "Enable"}
                    >
                      {plan.isActive ? (
                        <PowerOff className="h-5 w-5" />
                      ) : (
                        <Power className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <PlanForm plan={editingPlan} onClose={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}
