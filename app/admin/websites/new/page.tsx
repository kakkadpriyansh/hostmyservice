import { getPlans } from "@/app/actions/admin/plans";
import { getUsers } from "@/app/actions/admin/users";
import { WebsiteForm } from "@/components/admin/website-form";
import Link from "next/link";
import { ChevronRight, Globe } from "lucide-react";

export default async function NewWebsitePage() {
  const [users, plans] = await Promise.all([getUsers(), getPlans()]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/websites" className="hover:text-white transition-colors">
          Websites
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-white">Add New Website</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Add New Website</h1>
          <p className="text-sm text-gray-400">Create a new hosted website for a user</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="glass ring-1 ring-white/10 sm:rounded-2xl p-6 md:p-8">
        <WebsiteForm users={users} plans={plans} />
      </div>
    </div>
  );
}
