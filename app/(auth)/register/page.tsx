import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register - HostMyService",
  description: "Create an account",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Register</h1>
        {/* Register form will go here */}
      </div>
    </div>
  );
}
