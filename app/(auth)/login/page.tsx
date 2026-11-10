import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AppBackground } from "@/components/layout/app-background";

export const metadata: Metadata = {
  title: "Login - HostMyService",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#07133B] overflow-hidden font-sans selection:bg-[#00D2FF] selection:text-[#07133B]">
      <AppBackground />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <img
              src="/icon.png"
              alt="HostMyService Logo"
              className="h-11 w-11 rounded-xl object-contain bg-white p-1 shadow-md border border-white/20 group-hover:scale-105 transition-transform"
            />
            <span className="font-display font-extrabold text-2xl tracking-tight text-white group-hover:text-sky-200 transition-colors">
              HostMyService
            </span>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-display font-black tracking-tight text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-blue-200/70">
            Or{" "}
            <Link
              href="/register"
              className="font-bold text-[#00D2FF] hover:text-white transition-colors underline underline-offset-4 decoration-[#00D2FF]/40 hover:decoration-white"
            >
              create a new account
            </Link>
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#00D2FF]" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
