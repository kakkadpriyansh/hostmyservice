import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login - HostMyService",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background overflow-hidden font-sans">
       {/* Background Effects */}
      <div className="fixed inset-0 z-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
      <div className="glow-point top-[-20%] left-[-10%] opacity-20 animate-pulse-glow"></div>
      <div className="glow-point bottom-[-20%] right-[-10%] opacity-20 animate-pulse-glow" style={{ animationDelay: "2s" }}></div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
            <Link href="/" className="inline-block">
                <h2 className="text-3xl font-display font-bold tracking-tight text-white hover:text-primary transition-colors">
                HostMyService
                </h2>
            </Link>
            <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-gray-200">
            Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
            Or{" "}
            <Link
                href="/register"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
                create a new account
            </Link>
            </p>
        </div>
      </div>

      <div className="relative z-10">
        <Suspense fallback={
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}