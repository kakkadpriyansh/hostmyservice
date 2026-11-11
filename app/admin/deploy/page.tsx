import { getWebsites } from "@/app/actions/admin/websites";
import { getPendingDeployments } from "@/app/actions/admin/deploy";
import { DeployManager } from "@/components/admin/deploy-manager";
import { Server } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DeployPage() {
  const [websitesRes, pendingRes] = await Promise.all([
    getWebsites(),
    getPendingDeployments(),
  ]);

  const sites = websitesRes.success && websitesRes.data ? websitesRes.data : [];
  const pendingDeployments = pendingRes.success && pendingRes.data ? pendingRes.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center">
          <Server className="h-5 w-5 text-[#00f0ff]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Deployment Control Center</h1>
          <p className="text-sm text-gray-400">
            Review client-uploaded code, provision isolated databases, configure Nginx &amp; Let&apos;s Encrypt SSL, and deploy with 1-click.
          </p>
        </div>
      </div>

      <DeployManager sites={sites} pendingDeployments={pendingDeployments} />
    </div>
  );
}
