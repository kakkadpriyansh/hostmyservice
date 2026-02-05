import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Register - HostMyService",
  description: "Create an account",
};

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background overflow-hidden font-sans">
       {/* Background Effects */}
       <div className="fixed inset-0 z-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
       <div className="glow-point top-[-20%] right-[-10%] opacity-20 animate-pulse-glow"></div>
       <div className="glow-point bottom-[-20%] left-[-10%] opacity-20 animate-pulse-glow" style={{ animationDelay: "2s" }}></div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
            <Link href="/" className="inline-block">
                <h2 className="text-3xl font-display font-bold tracking-tight text-white hover:text-primary transition-colors">
                HostMyService
                </h2>
            </Link>
            <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-gray-200">
            Create your account
            </h2>
             <p className="mt-2 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link
                href="/login"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
                Sign in
            </Link>
            </p>
        </div>
      </div>

      <div className="relative z-10">
        <RegisterForm />
      </div>
    </div>
  );
}