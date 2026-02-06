import { getWebsiteById } from "@/app/actions/admin/websites";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, User, Shield, Server, Database, Download, GitBranch, ExternalLink } from "lucide-react";
import { EditSiteForm } from "./edit-site-form";
import { format } from "date-fns";

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

          {/* Deployments List */}
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Recent Deployments</h3>
            <div className="space-y-4">
              {site.deployments.length === 0 ? (
                <p className="text-gray-400 text-sm">No deployments found.</p>
              ) : (
                site.deployments.map((deployment) => (
                  <div key={deployment.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          deployment.status === 'DEPLOYED' ? 'bg-green-500/10 text-green-400' :
                          deployment.status === 'FAILED' ? 'bg-red-500/10 text-red-400' :
                          'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {deployment.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(deployment.createdAt), "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        {deployment.type === 'GIT' ? (
                          <>
                            <GitBranch className="h-4 w-4 text-purple-400" />
                            <span>Git: {deployment.gitBranch}</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 text-blue-400" />
                            <span>ZIP Upload</span>
                          </>
                        )}
                      </div>

                      {deployment.type === 'GIT' && deployment.gitRepoUrl && (
                        <a 
                          href={deployment.gitRepoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {deployment.gitRepoUrl}
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {deployment.type === 'ZIP' && (
                        <a
                          href={`/api/admin/deployments/${deployment.id}/download`}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Download Archive"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
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
