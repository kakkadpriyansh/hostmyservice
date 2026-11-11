"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function ReferralLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <code className="flex-1 truncate rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 font-mono text-sm text-[#00D2FF]">
        {url}
      </code>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
