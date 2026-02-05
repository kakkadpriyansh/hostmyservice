import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { User, Mail, Shield, Key } from "lucide-react";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Account Settings</h1>
        <p className="mt-2 text-sm text-gray-400">
          Manage your account profile and security preferences.
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
              <p className="text-sm text-gray-400">Your personal account details</p>
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
                <span className="capitalize">{session?.user?.role?.toLowerCase() || "User"}</span>
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
                <h3 className="text-sm font-medium text-white">Password</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Last changed: Never
                </p>
                <button className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors">
                  Change Password
                </button>
             </div>

             <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <h3 className="text-sm font-medium text-white">Two-Factor Authentication</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Add an extra layer of security to your account.
                </p>
                <button className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                  Enable 2FA
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
