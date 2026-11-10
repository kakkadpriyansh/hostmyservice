"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPassword } from "@/app/actions/auth";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { AppBackground } from "@/components/layout/app-background";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await forgotPassword(data.email);
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.error || "Failed to send reset link");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07133B] flex items-center justify-center p-4 selection:bg-[#00D2FF] selection:text-[#07133B]">
      <AppBackground />

      <div className="relative z-10 max-w-md w-full animate-fade-in-up">
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
        </div>

        <div className="glass rounded-[24px] border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white mb-2 font-display tracking-tight">
              Forgot Password
            </h1>
            <p className="text-sm text-blue-200/70">
              Enter your email to receive a password reset link
            </p>
          </div>

          {isSubmitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00D2FF]/15 border border-[#00D2FF]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#00D2FF]">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-display">
                Check your email
              </h3>
              <p className="text-sm text-blue-200/80 mb-8 leading-relaxed">
                If an account exists with that email, we&apos;ve sent instructions to
                reset your password.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center font-bold text-[#00D2FF] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-blue-100 mb-2">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-blue-300/60">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="block w-full appearance-none rounded-xl bg-white/10 border border-white/20 px-3.5 py-2.5 pl-11 placeholder-blue-200/40 shadow-inner focus:border-[#00D2FF] focus:outline-none focus:ring-2 focus:ring-[#00D2FF]/40 text-sm text-white transition-all"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-300">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center items-center rounded-xl bg-[#00D2FF] px-4 py-3 text-sm font-black text-[#07133B] shadow-[0_0_24px_rgba(0,210,255,0.4)] hover:bg-white hover:shadow-[0_0_30px_rgba(0,210,255,0.6)] focus:outline-none focus:ring-2 focus:ring-[#00D2FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm font-semibold text-blue-200/70 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
