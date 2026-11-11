"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { savePayoutDetails } from "@/app/actions/client/affiliate";
import { input, label, primaryButton } from "./styles";

interface PayoutDetailsFormProps {
  initial: {
    payoutMethod: string | null;
    upiId: string | null;
    bankAccountName: string | null;
    bankAccountNumber: string | null;
    bankIfsc: string | null;
  };
}

export function PayoutDetailsForm({ initial }: PayoutDetailsFormProps) {
  const router = useRouter();
  const [method, setMethod] = useState<"UPI" | "BANK">(initial.payoutMethod === "BANK" ? "BANK" : "UPI");
  const [upiId, setUpiId] = useState(initial.upiId ?? "");
  const [bankAccountName, setBankAccountName] = useState(initial.bankAccountName ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(initial.bankAccountNumber ?? "");
  const [bankIfsc, setBankIfsc] = useState(initial.bankIfsc ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await savePayoutDetails(
      method === "UPI" ? { payoutMethod: "UPI", upiId } : { payoutMethod: "BANK", bankAccountName, bankAccountNumber, bankIfsc }
    );
    setLoading(false);
    if (result.success) {
      setMessage({ ok: true, text: result.message ?? "Saved" });
      router.refresh();
    } else {
      setMessage({ ok: false, text: result.error });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex gap-2">
        {(["UPI", "BANK"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
              method === m ? "border-primary bg-primary/15 text-primary" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            {m === "UPI" ? "UPI" : "Bank transfer"}
          </button>
        ))}
      </div>

      {method === "UPI" ? (
        <div>
          <label className={label} htmlFor="upiId">UPI ID</label>
          <input id="upiId" required placeholder="name@okhdfcbank" value={upiId} onChange={(e) => setUpiId(e.target.value)} className={input} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="bankAccountName">Account holder name</label>
            <input id="bankAccountName" required value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="bankAccountNumber">Account number</label>
            <input
              id="bankAccountNumber"
              required
              inputMode="numeric"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              className={input}
            />
          </div>
          <div>
            <label className={label} htmlFor="bankIfsc">IFSC</label>
            <input id="bankIfsc" required placeholder="HDFC0001234" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} className={input} />
          </div>
        </div>
      )}

      {message && <p className={`text-sm ${message.ok ? "text-emerald-300" : "text-red-300"}`}>{message.text}</p>}

      <button type="submit" disabled={loading} className={primaryButton}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save payout details
      </button>
    </form>
  );
}
