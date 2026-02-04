import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Login - HostMyService",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <Suspense fallback={
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
