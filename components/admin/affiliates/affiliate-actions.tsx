"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  markPayoutPaid,
  rejectPayout,
  reverseCommission,
  reviewAffiliate,
  setAffiliateRate,
} from "@/app/actions/admin/affiliates";
import { dangerButton, input, primaryButton, secondaryButton } from "@/components/affiliate/styles";

type ActionResult = { success: true } | { success: false; error: string };

/** Runs an admin action, shows its error, refreshes the page on success. */
function useAction() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<ActionResult>) => {
    setLoading(true);
    setError(null);
    const result = await fn();
    setLoading(false);
    if (result.success) router.refresh();
    else setError(result.error);
    return result.success;
  };
  return { loading, error, run };
}

/** Approve / reject / suspend / reactivate, with an optional note shown to the affiliate. */
export function ReviewActions({ affiliateId, status }: { affiliateId: string; status: string }) {
  const { loading, error, run } = useAction();
  const [note, setNote] = useState("");

  const act = (action: "APPROVE" | "REJECT" | "SUSPEND" | "REACTIVATE") =>
    run(() => reviewAffiliate({ affiliateId, action, note: note || undefined }));

  const needsNote = status === "PENDING" || status === "APPROVED";

  return (
    <div className="space-y-3">
      {needsNote && (
        <textarea
          rows={2}
          placeholder={status === "PENDING" ? "Note to applicant (shown if rejected)" : "Reason (shown to the affiliate if suspended)"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={input}
        />
      )}
      <div className="flex flex-wrap gap-2">
        {(status === "PENDING" || status === "REJECTED") && (
          <button disabled={loading} onClick={() => act("APPROVE")} className={primaryButton}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Approve
          </button>
        )}
        {status === "PENDING" && (
          <button disabled={loading} onClick={() => act("REJECT")} className={dangerButton}>Reject</button>
        )}
        {status === "APPROVED" && (
          <button disabled={loading} onClick={() => act("SUSPEND")} className={dangerButton}>Suspend</button>
        )}
        {status === "SUSPENDED" && (
          <button disabled={loading} onClick={() => act("REACTIVATE")} className={primaryButton}>Reactivate</button>
        )}
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}

/** Per-affiliate commission override; empty = program default. */
export function RateForm({ affiliateId, rate, defaultRate }: { affiliateId: string; rate: number | null; defaultRate: number }) {
  const { loading, error, run } = useAction();
  const [value, setValue] = useState(rate === null ? "" : String(rate));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => setAffiliateRate({ affiliateId, commissionRate: value.trim() === "" ? null : Number(value) }));
      }}
      className="space-y-2"
    >
      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          max={100}
          step="0.1"
          placeholder={`Default (${defaultRate}%)`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${input} mt-0`}
        />
        <button type="submit" disabled={loading} className={secondaryButton}>Save</button>
      </div>
      <p className="text-xs text-gray-500">Leave empty to use the program default. Applies to new commissions only.</p>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </form>
  );
}

/** Mark a payout paid (with UTR) or reject it (with a reason). */
export function PayoutActions({ payoutId }: { payoutId: string }) {
  const { loading, error, run } = useAction();
  const [mode, setMode] = useState<"idle" | "pay" | "reject">("idle");
  const [text, setText] = useState("");

  if (mode === "idle") {
    return (
      <div className="flex gap-2">
        <button onClick={() => setMode("pay")} className={primaryButton}>Mark paid</button>
        <button onClick={() => setMode("reject")} className={dangerButton}>Reject</button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await run(() =>
          mode === "pay" ? markPayoutPaid({ payoutId, reference: text }) : rejectPayout({ payoutId, note: text })
        );
        if (ok) setMode("idle");
      }}
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
    >
      <input
        autoFocus
        required
        placeholder={mode === "pay" ? "UTR / transaction reference" : "Reason shown to the affiliate"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={`${input} mt-0 min-w-[220px]`}
      />
      <button type="submit" disabled={loading} className={mode === "pay" ? primaryButton : dangerButton}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "pay" ? "Confirm paid" : "Confirm reject"}
      </button>
      <button type="button" onClick={() => setMode("idle")} className={secondaryButton}>Cancel</button>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </form>
  );
}

/** Cancel an unpaid commission, e.g. after a refund. */
export function ReverseCommissionButton({ commissionId }: { commissionId: string }) {
  const { loading, error, run } = useAction();

  return (
    <div>
      <button
        disabled={loading}
        onClick={() => {
          const reason = prompt("Reason for reversing this commission (e.g. payment refunded):");
          if (reason) run(() => reverseCommission({ commissionId, reason }));
        }}
        className="text-xs font-medium text-red-300 hover:text-red-200 disabled:opacity-50"
      >
        Reverse
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
