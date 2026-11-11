"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { updateAffiliateSettings } from "@/app/actions/admin/affiliates";
import { input, label, primaryButton } from "@/components/affiliate/styles";

interface SettingsFormProps {
  settings: {
    programEnabled: boolean;
    applicationsOpen: boolean;
    defaultCommissionRate: number;
    commissionScope: "FIRST_PAYMENT" | "ALL_PAYMENTS";
    minPayoutPaise: number;
    holdDays: number;
    cookieDays: number;
  };
}

export function AffiliateSettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    programEnabled: settings.programEnabled,
    applicationsOpen: settings.applicationsOpen,
    defaultCommissionRate: String(settings.defaultCommissionRate),
    commissionScope: settings.commissionScope,
    minPayoutRupees: String(settings.minPayoutPaise / 100),
    holdDays: String(settings.holdDays),
    cookieDays: String(settings.cookieDays),
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await updateAffiliateSettings({
      programEnabled: form.programEnabled,
      applicationsOpen: form.applicationsOpen,
      defaultCommissionRate: Number(form.defaultCommissionRate),
      commissionScope: form.commissionScope,
      minPayoutRupees: Number(form.minPayoutRupees),
      holdDays: Number(form.holdDays),
      cookieDays: Number(form.cookieDays),
    });
    setLoading(false);
    setMessage(result.success ? { ok: true, text: "Settings saved" } : { ok: false, text: result.error });
    if (result.success) router.refresh();
  }

  const toggle = (key: "programEnabled" | "applicationsOpen", text: string, hint: string) => (
    <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <input
        type="checkbox"
        checked={form[key]}
        onChange={(e) => set(key, e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5"
      />
      <span>
        <span className="block text-sm font-medium text-white">{text}</span>
        <span className="block text-xs text-gray-400">{hint}</span>
      </span>
    </label>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        {toggle("programEnabled", "Program enabled", "When off, links stop tracking and no new commissions are earned.")}
        {toggle("applicationsOpen", "Accepting applications", "When off, users can't apply. Existing affiliates are unaffected.")}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={label} htmlFor="rate">Default commission (%)</label>
          <input id="rate" type="number" min={0} max={100} step="0.1" required value={form.defaultCommissionRate}
            onChange={(e) => set("defaultCommissionRate", e.target.value)} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="scope">Pays commission on</label>
          <select id="scope" value={form.commissionScope}
            onChange={(e) => set("commissionScope", e.target.value as typeof form.commissionScope)} className={input}>
            <option value="ALL_PAYMENTS" className="bg-[#061138]">Every payment (incl. renewals)</option>
            <option value="FIRST_PAYMENT" className="bg-[#061138]">First payment only</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="min">Minimum payout (₹)</label>
          <input id="min" type="number" min={1} step={1} required value={form.minPayoutRupees}
            onChange={(e) => set("minPayoutRupees", e.target.value)} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="hold">Hold period (days)</label>
          <input id="hold" type="number" min={0} max={365} step={1} required value={form.holdDays}
            onChange={(e) => set("holdDays", e.target.value)} className={input} />
          <p className="mt-1 text-xs text-gray-500">Keep at least your refund window (7 days).</p>
        </div>
        <div>
          <label className={label} htmlFor="cookie">Referral cookie (days)</label>
          <input id="cookie" type="number" min={1} max={365} step={1} required value={form.cookieDays}
            onChange={(e) => set("cookieDays", e.target.value)} className={input} />
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Rate changes apply to new commissions only. Affiliates with a custom rate keep it.
      </p>

      {message && <p className={`text-sm ${message.ok ? "text-emerald-300" : "text-red-300"}`}>{message.text}</p>}

      <button type="submit" disabled={loading} className={primaryButton}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save settings
      </button>
    </form>
  );
}
