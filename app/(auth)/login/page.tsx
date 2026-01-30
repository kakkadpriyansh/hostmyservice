import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - HostMyService",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        {/* Login form will go here */}
      </div>
    </div>
  );
}
