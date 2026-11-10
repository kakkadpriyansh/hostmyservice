"use client";

import { useEffect } from "react";
import { AppBackground } from "@/components/layout/app-background";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07133B] text-white relative overflow-hidden font-sans selection:bg-[#00D2FF] selection:text-[#07133B] p-4">
      <AppBackground />

      <div className="z-10 text-center p-8 max-w-lg w-full glass rounded-[24px] border border-white/15 shadow-2xl animate-fade-in-up bg-white/10 backdrop-blur-2xl">
        <h1 className="text-3xl font-display font-black text-[#ff003c] mb-2 tracking-tight">Something went wrong!</h1>
        <p className="mt-4 text-blue-200/70 text-base leading-relaxed">
          An unexpected error has occurred. Our team has been notified.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-[#00D2FF] px-6 py-3 text-[#07133B] font-bold shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:bg-white hover:shadow-[0_0_30px_rgba(0,210,255,0.6)] transition-all duration-300"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-white font-semibold hover:bg-white/20 transition-all duration-300"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
