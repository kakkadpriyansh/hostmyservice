"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html className="bg-[#050505]">
      <body className="bg-[#050505] text-white antialiased font-sans">
        <div className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden">
          {/* Background Effects */}
          <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          <div className="absolute top-[-100px] left-[-100px] h-[300px] w-[300px] rounded-full bg-[#00f0ff]/20 blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[-100px] right-[-100px] h-[300px] w-[300px] rounded-full bg-[#7000ff]/20 blur-[100px] pointer-events-none"></div>

          <div className="z-10 text-center p-8 max-w-md w-full glass rounded-2xl border border-white/10 shadow-2xl">
            <h1 className="text-5xl font-display font-bold text-[#ff003c] mb-2">Critical Error</h1>
            <p className="mt-4 text-gray-400 text-lg">
              A critical system error occurred. Please try refreshing.
            </p>
            <button
              onClick={() => reset()}
              className="mt-8 w-full rounded-xl bg-[#00f0ff] px-6 py-3 text-black font-bold shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:bg-[#00f0ff]/90 hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all duration-300"
            >
              Refresh Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
