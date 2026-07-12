import { getWebsites } from "@/app/actions/admin/websites";
import { DeployManager } from "@/components/admin/deploy-manager";
import { Server } from "lucide-react";

export default async function DeployPage() {
  const result = await getWebsites();
  const sites = (result.success && result.data) ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Server className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Manual Deployment</h1>
          <p className="text-sm text-gray-400">
            Upload a ZIP file containing build output (HTML/CSS/JS) to deploy to the selected website.
            Ensure the ZIP contains an <code className="text-primary font-mono text-xs bg-primary/10 px-1 py-0.5 rounded">index.html</code> at the root.
          </p>
        </div>
      </div>

      <DeployManager sites={sites} />
    </div>
  );
}
