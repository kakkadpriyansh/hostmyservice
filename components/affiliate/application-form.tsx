"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { applyForAffiliate } from "@/app/actions/client/affiliate";
import { card, input, label, primaryButton } from "./styles";

interface ApplicationFormProps {
  defaultRate: number;
  holdDays: number;
  minPayout: string;
  previous?: { website: string | null; promotionPlan: string | null } | null;
}

export function AffiliateApplicationForm({ defaultRate, holdDays, minPayout, previous }: ApplicationFormProps) {
  const router = useRouter();
  const [website, setWebsite] = useState(previous?.website ?? "");
  const [promotionPlan, setPromotionPlan] = useState(previous?.promotionPlan ?? "");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await applyForAffiliate({ website, promotionPlan, acceptTerms });
    setLoading(false);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`${card} space-y-5`}>
      <div>
        <h2 className="text-lg font-bold text-white">Apply to the Developer Affiliate Program</h2>
        <p className="mt-1 text-sm text-gray-400">
          Earn {defaultRate}% of every payment from customers you refer (excluding GST). Earnings become
          withdrawable {holdDays} days after the payment, and you can request a payout from {minPayout}.
        </p>
      </div>

      <div>
        <label className={label} htmlFor="website">Website, GitHub or channel</label>
        <input
          id="website"
          type="url"
          required
          placeholder="https://github.com/you"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className={input}
        />
      </div>

      <div>
        <label className={label} htmlFor="promotionPlan">How will you refer customers?</label>
        <textarea
          id="promotionPlan"
          required
          rows={4}
          placeholder="e.g. I build sites for local businesses and host them for clients; I write tutorials for…"
          value={promotionPlan}
          onChange={(e) => setPromotionPlan(e.target.value)}
          className={input}
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5"
        />
        <span>
          I won&apos;t refer myself or use spam, paid ads on the HostMyService brand, or misleading claims.
          Commissions on refunded payments are cancelled, and HostMyService may suspend accounts that break these rules.
        </span>
      </label>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button type="submit" disabled={loading} className={primaryButton}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Submit application
      </button>
    </form>
  );
}
