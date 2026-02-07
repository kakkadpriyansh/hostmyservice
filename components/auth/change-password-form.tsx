"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "@/lib/validations";
import { changePassword } from "@/app/actions/auth";
import { z } from "zod";
import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await changePassword(data);

      if (result.success) {
        setMessage({ type: "success", text: "Password updated successfully" });
        reset();
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update password" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {message && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm ${
            message.type === "success"
              ? "bg-green-500/10 text-green-500 border border-green-500/20"
              : "bg-red-500/10 text-red-500 border border-red-500/20"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200">Current Password</label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              {...register("currentPassword")}
              type="password"
              className="block w-full rounded-lg border border-white/10 bg-white/5 pl-10 py-2 text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-red-400">{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200">New Password</label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              {...register("newPassword")}
              type="password"
              className="block w-full rounded-lg border border-white/10 bg-white/5 pl-10 py-2 text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-400">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200">Confirm New Password</label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              {...register("confirmNewPassword")}
              type="password"
              className="block w-full rounded-lg border border-white/10 bg-white/5 pl-10 py-2 text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          {errors.confirmNewPassword && (
            <p className="mt-1 text-xs text-red-400">{errors.confirmNewPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Update Password
        </button>
      </form>
    </div>
  );
}
