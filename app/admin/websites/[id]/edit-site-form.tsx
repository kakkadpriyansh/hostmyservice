"use client";

import { useState } from "react";
import { updateSiteDetails } from "@/app/actions/admin/websites";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditSiteFormProps {
  site: {
    id: string;
    domain: string;
    status: string; // "ACTIVE" | "SUSPENDED" | "DELETED"
    sslStatus: string; // "NONE" | "PENDING" | "ACTIVE" | "FAILED"
    serverIp: string | null;
    serverPath: string | null;
    dbConnection?: string | null;
  };
}

export function EditSiteForm({ site }: EditSiteFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    
    const result = await updateSiteDetails(formData);
    
    setLoading(false);
    if (result.success) {
      // Optional: Show success message or toast
      alert("Updated successfully");
      router.refresh();
    } else {
      setError(result.error || "Failed to update");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="siteId" value={site.id} />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Domain Name</label>
          <input
            name="domain"
            defaultValue={site.domain}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
            <div className="relative">
              <select
                name="status"
                defaultValue={site.status}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none appearance-none"
              >
                <option value="ACTIVE" className="bg-black">Active</option>
                <option value="SUSPENDED" className="bg-black">Suspended</option>
                <option value="DELETED" className="bg-black">Deleted</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">SSL Status</label>
            <div className="relative">
              <select
                name="sslStatus"
                defaultValue={site.sslStatus}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none appearance-none"
              >
                <option value="NONE" className="bg-black">None</option>
                <option value="PENDING" className="bg-black">Pending</option>
                <option value="ACTIVE" className="bg-black">Active</option>
                <option value="FAILED" className="bg-black">Failed</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <h4 className="text-sm font-bold text-white mb-4">Server Configuration</h4>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Server IP Address</label>
              <input
                name="serverIp"
                defaultValue={site.serverIp || ""}
                placeholder="e.g. 192.168.1.1"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Server Path</label>
              <input
                name="serverPath"
                defaultValue={site.serverPath || ""}
                placeholder="e.g. /var/www/example.com"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <h4 className="text-sm font-bold text-white mb-4">Database Configuration</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Database Connection String</label>
            <input
              name="dbConnection"
              defaultValue={site.dbConnection || ""}
              placeholder="postgres://user:pass@host:port/dbname"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">This connection string will be visible to the user in their dashboard.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-black px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Configuration
        </button>
      </div>
    </form>
  );
}
