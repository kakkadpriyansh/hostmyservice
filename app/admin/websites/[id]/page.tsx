import { getWebsiteById } from "@/app/actions/admin/websites";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, User, Shield, Server, Database } from "lucide-react";
import { EditSiteForm } from "./edit-site-form";

export default async function WebsiteDetailsPage({ params }: { params: { id: string } }) {
  const result = await getWebsiteById(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const site = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/websites"
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Edit Website Details</h1>
          <p className="text-sm text-gray-400">Manage configuration for {site.domain}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/10">
            <EditSiteForm site={site} />
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Quick Info</h3>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Owner</p>
                <p className="text-sm text-gray-400">{site.user.name || "Unknown"}</p>
                <p className="text-xs text-gray-500">{site.user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Plan</p>
                <p className="text-sm text-gray-400">{site.subscription?.plan?.name || "No Plan"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Shield className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-sm font-medium text-white">SSL Status</p>
                    <p className={`text-sm ${
                        site.sslStatus === 'ACTIVE' ? 'text-green-400' : 
                        site.sslStatus === 'PENDING' ? 'text-yellow-400' : 'text-gray-400'
                    }`}>{site.sslStatus}</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
