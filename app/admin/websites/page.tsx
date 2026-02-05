import { getWebsites, toggleSiteStatus } from "@/app/actions/admin/websites";
import { format } from "date-fns";
import { Shield, Globe, MoreVertical, Play, Pause, ExternalLink } from "lucide-react";
import Link from "next/link";
import { SSLButton } from "@/components/admin/ssl-button";

export default async function WebsitesPage() {
  const result = await getWebsites();
  const websites = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-white">Website Management</h1>
        <Link
          href="/admin/websites/new"
          className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-bold text-black shadow-sm transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Add Website
        </Link>
      </div>

      <div className="glass ring-1 ring-white/10 sm:rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/5">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Domain / User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  SSL
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Deployment
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent">
              {websites?.map((site: any) => (
                <tr key={site.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{site.domain}</div>
                        <div className="text-sm text-gray-400">{site.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      site.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                      site.status === 'SUSPENDED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {site.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center">
                        <Shield className={`h-4 w-4 mr-1.5 ${
                            site.sslStatus === 'ACTIVE' ? 'text-green-400' : 
                            site.sslStatus === 'PENDING' ? 'text-yellow-400' : 'text-gray-400'
                        }`} />
                        <span className="text-sm text-gray-300">{site.sslStatus}</span>
                        </div>
                        <SSLButton siteId={site.id} status={site.sslStatus} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {site.subscription?.plan?.name || "No Plan"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {site.deployments?.[0] ? (
                        <div className="flex flex-col">
                            <span className="text-white">{site.deployments[0].status}</span>
                            <span className="text-xs text-gray-500">{format(new Date(site.deployments[0].createdAt), 'MMM d, HH:mm')}</span>
                        </div>
                    ) : "Never"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <form action={async () => {
                      "use server";
                      await toggleSiteStatus(site.id, site.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                    }}>
                      <button className="text-primary hover:text-white flex items-center justify-end gap-2 w-full transition-colors">
                         {site.status === 'ACTIVE' ? (
                             <>
                                <Pause className="h-4 w-4" /> Suspend
                             </>
                         ) : (
                             <>
                                <Play className="h-4 w-4" /> Enable
                             </>
                         )}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {websites?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No websites found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
