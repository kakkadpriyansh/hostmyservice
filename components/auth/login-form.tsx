"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        // Force reload to ensure session is updated
        window.location.href = callbackUrl;
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
      <div className="glass py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-400">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email address
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-gray-500" aria-hidden="true" />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="block w-full appearance-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 pl-10 placeholder-gray-500 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm text-white transition-all"
                placeholder="you@example.com"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <div className="mt-1 relative rounded-md shadow-sm">
               <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-500" aria-hidden="true" />
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="block w-full appearance-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 pl-10 placeholder-gray-500 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm text-white transition-all"
                placeholder="••••••••"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-black shadow-lg hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}