"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] text-white relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute top-[-100px] left-[-100px] h-[300px] w-[300px] rounded-full bg-[#00f0ff]/20 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] h-[300px] w-[300px] rounded-full bg-[#7000ff]/20 blur-[100px] pointer-events-none"></div>

      <div className="z-10 text-center p-8 max-w-lg w-full glass rounded-2xl border border-white/10 shadow-2xl animate-fade-in-up">
        <h1 className="text-4xl font-display font-bold text-[#ff003c] mb-2">Something went wrong!</h1>
        <p className="mt-4 text-gray-400 text-lg">
          An unexpected error has occurred. Our team has been notified.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-[#00f0ff] px-6 py-3 text-black font-bold shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:bg-[#00f0ff]/90 hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all duration-300"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-white font-semibold hover:bg-white/10 hover:border-white/40 transition-all duration-300"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
