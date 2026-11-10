"use client";

import { useState, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPassword } from "@/app/actions/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import { AppBackground } from "@/components/layout/app-background";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await resetPassword(token, data.password);
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(result.error || "Something went wrong");
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
              Reset Password
            </h1>
            <p className="text-sm text-blue-200/70">Create a new password for your account</p>
          </div>

          {isSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-display">
                Password reset successfully!
              </h3>
              <p className="text-sm text-blue-200/80 mb-6 leading-relaxed">
                Redirecting you to the login page...
              </p>
              <Link
                href="/login"
                className="inline-flex items-center font-bold text-[#00D2FF] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Login now
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
                  New Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="block w-full appearance-none rounded-xl bg-white/10 border border-white/20 px-3.5 py-2.5 pr-11 placeholder-blue-200/40 shadow-inner focus:border-[#00D2FF] focus:outline-none focus:ring-2 focus:ring-[#00D2FF]/40 text-sm text-white transition-all"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-blue-300/60 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-300">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-100 mb-2">
                  Confirm Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="block w-full appearance-none rounded-xl bg-white/10 border border-white/20 px-3.5 py-2.5 pr-11 placeholder-blue-200/40 shadow-inner focus:border-[#00D2FF] focus:outline-none focus:ring-2 focus:ring-[#00D2FF]/40 text-sm text-white transition-all"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-blue-300/60 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-300">
                    {errors.confirmPassword.message}
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
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
