import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
      <div className="glow-point top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 animate-pulse-glow"></div>

      <div className="relative z-10 text-center animate-fade-in-up">
        <h1 className="text-9xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 opacity-50">
          404
        </h1>
        <h2 className="mt-8 text-3xl font-display font-bold text-white tracking-tight">
          Page Not Found
        </h2>
        <p className="mt-4 text-gray-400 text-lg max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <Link
          href="/dashboard"
          className="mt-10 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold text-black transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:scale-105"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
