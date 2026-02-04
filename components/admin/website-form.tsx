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
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
          User
        </label>
        <select
          name="userId"
          id="userId"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        >
          <option value="">Select a user</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
          Domain
        </label>
        <input
          type="text"
          name="domain"
          id="domain"
          required
          placeholder="example.com"
          pattern="^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
        <p className="mt-1 text-xs text-gray-500">Only lowercase domains allowed.</p>
      </div>

      <div>
        <label htmlFor="planId" className="block text-sm font-medium text-gray-700">
          Hosting Plan
        </label>
        <select
          name="planId"
          id="planId"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        >
          <option value="">Select a plan</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} - ₹{plan.price}/{plan.duration} days
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Website"}
        </button>
      </div>
    </form>
  );
}
