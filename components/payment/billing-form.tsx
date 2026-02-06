"use client";

import { useState } from "react";
import { updateUserProfile, ProfileData } from "@/app/actions/client/profile";
import { Loader2 } from "lucide-react";

interface BillingFormProps {
  onSuccess: () => void;
  initialData?: Partial<ProfileData>;
}

export function BillingForm({ onSuccess, initialData }: BillingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: ProfileData = {
      phoneNumber: formData.get("phoneNumber") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      postalCode: formData.get("postalCode") as string,
      country: formData.get("country") as string,
    };

    const res = await updateUserProfile(data);

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setLoading(false);
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white">Billing Details</h3>
        <p className="text-sm text-gray-400">Please provide your contact information to continue.</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Phone Number</label>
          <input
            name="phoneNumber"
            defaultValue={initialData?.phoneNumber}
            required
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none"
            placeholder="+91 9876543210"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Address</label>
          <textarea
            name="address"
            defaultValue={initialData?.address}
            required
            rows={2}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none"
            placeholder="Street Address"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 uppercase font-bold mb-1">City</label>
            <input
              name="city"
              defaultValue={initialData?.city}
              required
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none"
              placeholder="City"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 uppercase font-bold mb-1">State</label>
            <input
              name="state"
              defaultValue={initialData?.state}
              required
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none"
              placeholder="State"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Postal Code</label>
            <input
              name="postalCode"
              defaultValue={initialData?.postalCode}
              required
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none"
              placeholder="ZIP Code"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Country</label>
            <input
              name="country"
              defaultValue={initialData?.country}
              required
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none"
              placeholder="Country"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-4 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Continue to Payment"}
      </button>
    </form>
  );
}
