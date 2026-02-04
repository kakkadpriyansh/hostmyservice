"use client";

import { useState } from "react";
import { getPlans, togglePlanStatus } from "@/app/actions/admin/plans";
import { PlanForm } from "@/components/admin/plan-form";
import { Plus, Pencil, Power, PowerOff } from "lucide-react";
import { useEffect } from "react";

type Plan = {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string | null;
  isActive: boolean;
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
    await togglePlanStatus(plan.id, !plan.isActive);
    loadPlans();
  };

  if (loading) return <div>Loading plans...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hosting Plans</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {plan.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {plan.description}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  ₹{plan.price}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {plan.duration} days
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      plan.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(plan)}
                      className={`${
                        plan.isActive
                          ? "text-red-600 hover:text-red-900"
                          : "text-green-600 hover:text-green-900"
                      }`}
                      title={plan.isActive ? "Disable" : "Enable"}
                    >
                      {plan.isActive ? (
                        <PowerOff className="h-5 w-5" />
                      ) : (
                        <Power className="h-5 w-5" />
                      )}
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
