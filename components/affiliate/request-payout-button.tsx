"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Loader2 } from "lucide-react";
import { requestPayout } from "@/app/actions/client/affiliate";
import { primaryButton } from "./styles";

interface RequestPayoutButtonProps {
  disabled: boolean;
  reason?: string;
}

export function RequestPayoutButton({ disabled, reason }: RequestPayoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onClick() {
    setLoading(true);
    setMessage(null);
    const result = await requestPayout();
    setLoading(false);
    setMessage(result.success ? { ok: true, text: result.message ?? "Requested" } : { ok: false, text: result.error });
    if (result.success) router.refresh();
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={onClick} disabled={disabled || loading} className={primaryButton}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
        Request payout
      </button>
      {disabled && reason && !message && <p className="text-xs text-gray-400">{reason}</p>}
      {message && <p className={`text-sm ${message.ok ? "text-emerald-300" : "text-red-300"}`}>{message.text}</p>}
    </div>
  );
}
