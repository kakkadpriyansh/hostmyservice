"use client";

import { useState } from "react";
import { createPlan, updatePlan } from "@/app/actions/admin/plans";
import { X } from "lucide-react";

interface PlanFormProps {
  plan?: {
    id: string;
    name: string;
    price: number;
    price2Years?: number | null;
    price3Years?: number | null;
    duration: number;
    description: string | null;
    features?: string[];
    requiresEnv?: boolean;
    providesDb?: boolean;
  };
  onClose: () => void;
}

export function PlanForm({ plan, onClose }: PlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: plan?.name || "",
    price: plan?.price || 0,
    price2Years: plan?.price2Years || 0,
    price3Years: plan?.price3Years || 0,
    duration: plan?.duration || 365,
    description: plan?.description || "",
    features: plan?.features?.join("\n") || "",
    requiresEnv: !!plan?.requiresEnv,
    providesDb: !!plan?.providesDb,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        features: formData.features.split("\n").filter((f) => f.trim() !== ""),
        // Ensure we send numbers or undefined if 0/empty
        price2Years: formData.price2Years > 0 ? formData.price2Years : undefined,
        price3Years: formData.price3Years > 0 ? formData.price3Years : undefined,
      };
      
      if (plan) {
        await updatePlan(plan.id, dataToSubmit);
      } else {
        await createPlan(dataToSubmit);
      }
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
          <h2 className="text-xl font-bold font-display text-white">
            {plan ? "Edit Plan" : "Create Plan"}
          </h2>
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
              Name
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Price (1 Year)
              </label>
              <input
                type="number"
                required
                min="0"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Duration (days)
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Price (2 Years) - Optional
              </label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                value={formData.price2Years || ""}
                placeholder="Leave empty to use 2x 1-year price"
                onChange={(e) =>
                  setFormData({ ...formData, price2Years: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Price (3 Years) - Optional
              </label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                value={formData.price3Years || ""}
                placeholder="Leave empty to use 3x 1-year price"
                onChange={(e) =>
                  setFormData({ ...formData, price3Years: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              rows={3}
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Features (one per line)
            </label>
            <textarea
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              rows={5}
              placeholder="Static Website Hosting&#10;Free SSL Certificate&#10;DDoS Protection"
              value={formData.features}
              onChange={(e) =>
                setFormData({ ...formData, features: e.target.value })
              }
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={formData.requiresEnv}
                onChange={(e) =>
                  setFormData({ ...formData, requiresEnv: e.target.checked })
                }
                className="h-4 w-4 rounded border border-white/20 bg-white/5"
              />
              Require .env from user
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={formData.providesDb}
                onChange={(e) =>
                  setFormData({ ...formData, providesDb: e.target.checked })
                }
                className="h-4 w-4 rounded border border-white/20 bg-white/5"
              />
              Provide database connection
            </label>
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
              {loading ? "Saving..." : "Save Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
