"use client";

import { createWebsite } from "@/app/actions/admin/websites";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, User, Globe, LayoutGrid } from "lucide-react";
import Link from "next/link";

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
    <form action={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-3 rounded-lg text-sm flex items-start gap-2">
          <span className="mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* User */}
      <div className="space-y-1.5">
        <label htmlFor="userId" className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <User className="h-4 w-4 text-primary" />
          User
        </label>
        <select
          name="userId"
          id="userId"
          required
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
        >
          <option value="" className="bg-[#0d0d0d] text-gray-400">Select a user</option>
          {users.map((user) => (
            <option key={user.id} value={user.id} className="bg-[#0d0d0d] text-white">
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {/* Domain */}
      <div className="space-y-1.5">
        <label htmlFor="domain" className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Globe className="h-4 w-4 text-primary" />
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
        <p className="text-xs text-gray-500">Enter a valid domain, e.g. <span className="text-gray-400 font-mono">mysite.com</span></p>
      </div>

      {/* Plan */}
      <div className="space-y-1.5">
        <label htmlFor="planId" className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <LayoutGrid className="h-4 w-4 text-primary" />
          Hosting Plan
        </label>
        <select
          name="planId"
          id="planId"
          required
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
        >
          <option value="" className="bg-[#0d0d0d] text-gray-400">Select a plan</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id} className="bg-[#0d0d0d] text-white">
              {plan.name} — ₹{plan.price} / {plan.duration} days
            </option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/websites"
          className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white rounded-lg border border-white/10 hover:bg-white/5 transition-all"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-black shadow-lg hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating..." : "Create Website"}
        </button>
      </div>
    </form>
  );
}
