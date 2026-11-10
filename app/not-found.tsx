import Link from "next/link";
import { AppBackground } from "@/components/layout/app-background";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07133B] text-foreground relative overflow-hidden font-sans selection:bg-[#00D2FF] selection:text-[#07133B]">
      <AppBackground />

      <div className="relative z-10 text-center animate-fade-in-up px-4">
        <h1 className="text-9xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white/40 to-transparent opacity-80">
          404
        </h1>
        <h2 className="mt-6 text-3xl md:text-4xl font-display font-black text-white tracking-tight">
          Page Not Found
        </h2>
        <p className="mt-4 text-blue-200/70 text-base max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[#00D2FF] px-8 py-3 text-sm font-bold text-[#07133B] transition-all hover:bg-white hover:shadow-[0_0_25px_rgba(0,210,255,0.6)] hover:scale-105"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
