import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { User, Mail, Shield, Key } from "lucide-react";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Admin Settings</h1>
        <p className="mt-2 text-sm text-gray-400">
          Manage your admin account and security preferences.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Profile Information */}
        <div className="glass rounded-2xl p-8 border border-white/10 space-y-6">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Profile Information</h2>
              <p className="text-sm text-gray-400">Your admin account details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                Full Name
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 text-white">
                <User className="h-4 w-4 text-gray-500" />
                <span>{session?.user?.name || "Not set"}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 text-white">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{session?.user?.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                Account Role
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 text-white">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="capitalize">{session?.user?.role?.toLowerCase() || "Admin"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="glass rounded-2xl p-8 border border-white/10 space-y-6">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Security</h2>
              <p className="text-sm text-gray-400">Password and authentication</p>
            </div>
          </div>

          <div className="space-y-4">
             <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <h3 className="text-sm font-medium text-white mb-4">Change Password</h3>
                <ChangePasswordForm />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
