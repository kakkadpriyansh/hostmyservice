"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/validations";
import { registerUser } from "@/app/actions/auth";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Loader2, Mail, Lock, User, AlertCircle } from "lucide-react";

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await registerUser(data);

      if (result.success) {
        const loginResult = await signIn("credentials", {
          redirect: false,
          email: data.email,
          password: data.password,
        });

        if (loginResult?.error) {
          router.push("/login");
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
      <div className="glass rounded-2xl sm:rounded-[24px] border border-white/15 bg-white/10 py-6 px-4 sm:py-8 sm:px-10 shadow-2xl backdrop-blur-2xl">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" aria-hidden="true" />
                <h3 className="ml-3 text-sm font-semibold text-red-300">{error}</h3>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-blue-100 mb-1.5"
            >
              Full Name
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-blue-300/60">
                <User className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className="block w-full appearance-none rounded-xl bg-white/10 border border-white/20 px-3.5 py-2.5 pl-11 placeholder-blue-200/40 shadow-inner focus:border-[#00D2FF] focus:outline-none focus:ring-2 focus:ring-[#00D2FF]/40 text-sm text-white transition-all"
                placeholder="John Doe"
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-300">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-blue-100 mb-1.5"
            >
              Email address
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-blue-300/60">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="block w-full appearance-none rounded-xl bg-white/10 border border-white/20 px-3.5 py-2.5 pl-11 placeholder-blue-200/40 shadow-inner focus:border-[#00D2FF] focus:outline-none focus:ring-2 focus:ring-[#00D2FF]/40 text-sm text-white transition-all"
                placeholder="you@example.com"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-300">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-blue-100 mb-1.5"
            >
              Password
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-blue-300/60">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className="block w-full appearance-none rounded-xl bg-white/10 border border-white/20 px-3.5 py-2.5 pl-11 placeholder-blue-200/40 shadow-inner focus:border-[#00D2FF] focus:outline-none focus:ring-2 focus:ring-[#00D2FF]/40 text-sm text-white transition-all"
                placeholder="••••••••"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-300">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center items-center rounded-xl bg-[#00D2FF] px-4 py-3 text-sm font-black text-[#07133B] shadow-[0_0_24px_rgba(0,210,255,0.4)] hover:bg-white hover:shadow-[0_0_30px_rgba(0,210,255,0.6)] focus:outline-none focus:ring-2 focus:ring-[#00D2FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
