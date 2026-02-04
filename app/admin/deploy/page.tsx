import { getWebsites } from "@/app/actions/admin/websites";
import { DeployManager } from "@/components/admin/deploy-manager";

export default async function DeployPage() {
  const result = await getWebsites();
  const sites = (result.success && result.data) ? result.data : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manual Deployment</h1>
      <p className="text-gray-500 max-w-2xl">
        Upload a ZIP file containing the build output (HTML/CSS/JS) to deploy to the selected website.
        Ensure the ZIP contains an <code>index.html</code> at the root or in a subfolder.
      </p>
      
      <DeployManager sites={sites} />
    </div>
  );
}
