"use client";

import { createWebsite } from "@/app/actions/admin/websites";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface WebsiteFormProps {
  users: any[];
  plans: any[];
}

export function WebsiteForm({ users, plans }: WebsiteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError("");

    const result = await createWebsite(formData);

    if (result.success) {
      router.push("/admin/websites");
      router.refresh();
    } else {
      setError(result.error || "Failed to create website");
      setLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="userId" className="block text-sm font-medium text-gray-300 mb-1">
          User
        </label>
        <select
          name="userId"
          id="userId"
          required
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none"
        >
          <option value="" className="bg-[#0A0A0A]">Select a user</option>
          {users.map((user) => (
            <option key={user.id} value={user.id} className="bg-[#0A0A0A]">
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="domain" className="block text-sm font-medium text-gray-300 mb-1">
          Domain
        </label>
        <input
          type="text"
          name="domain"
          id="domain"
          required
          placeholder="example.com"
          pattern="^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
        />
        <p className="mt-1 text-xs text-gray-400">Only lowercase domains allowed.</p>
      </div>

      <div>
        <label htmlFor="planId" className="block text-sm font-medium text-gray-300 mb-1">
          Hosting Plan
        </label>
        <select
          name="planId"
          id="planId"
          required
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none"
        >
          <option value="" className="bg-[#0A0A0A]">Select a plan</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id} className="bg-[#0A0A0A]">
              {plan.name} - ₹{plan.price}/{plan.duration} days
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-black shadow-lg hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Website"}
        </button>
      </div>
    </form>
  );
}
