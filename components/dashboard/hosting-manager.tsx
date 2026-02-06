"use client";

import { useState } from "react";
import { SubscriptionWithPlan } from "@/types";
import { createSite } from "@/app/actions/client/sites";
import { saveEnvVars } from "@/app/actions/client/sites";
import { deploySite } from "@/app/actions/client/deploy";
import { Globe, Upload, Server, CheckCircle, AlertCircle, Loader2, Pencil, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface HostingManagerProps {
  sub: SubscriptionWithPlan;
}

export function HostingManager({ sub }: HostingManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Setup State
  const [domain, setDomain] = useState("");

  // Upload State
  const [file, setFile] = useState<File | null>(null);

  // Env State
  const [savedEnvContent, setSavedEnvContent] = useState((sub.site as any)?.envVars || "");
  const [envContent, setEnvContent] = useState(savedEnvContent);
  const [isEnvEditing, setIsEnvEditing] = useState(!savedEnvContent);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await createSite(sub.id, domain);
      if (!res.success) {
        setError(res.error || "Failed to setup site");
      } else {
        setSuccess("Site initialized successfully!");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault();
    if (!sub.site || !file) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("siteId", sub.site.id);
    formData.append("file", file);

    try {
      const res = await deploySite(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Deployment queued! Waiting for admin approval.");
        setFile(null);
      }
    } catch (err) {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  if (!sub.site) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Setup Hosting</h3>
            <p className="text-sm text-gray-400">
              Connect a domain to start hosting with your {sub.plan.name} plan.
            </p>
          </div>
        </div>

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Domain Name
            </label>
            <input
              type="text"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-black transition-all hover:bg-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Initialize Site"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{(sub.site as any).domain}</h3>
            <div className="flex items-center gap-2 mt-1">
               <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  (sub.site as any).serverIp ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
               )}>
                 {(sub.site as any).serverIp ? "Active" : "Pending Assignment"}
               </span>
               {(sub.site as any).serverIp && (
                 <span className="text-xs text-gray-400 font-mono">
                   {(sub.site as any).serverIp}
                 </span>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {sub.plan.requiresEnv && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">Environment Variables (.env)</h4>
                {!isEnvEditing && (
                    <button
                        onClick={() => setIsEnvEditing(true)}
                        className="text-xs flex items-center gap-1 text-primary hover:text-white transition-colors"
                    >
                        <Pencil className="h-3 w-3" /> Edit
                    </button>
                )}
            </div>

            {isEnvEditing ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!sub.site) return;
                    setLoading(true);
                    setError(null);
                    setSuccess(null);
                    const res = await saveEnvVars(sub.site.id, envContent);
                    if (!res.success) {
                      setError(res.error || "Failed to save environment variables");
                    } else {
                      setSuccess(".env saved successfully");
                      setSavedEnvContent(envContent);
                      setIsEnvEditing(false);
                    }
                    setLoading(false);
                  }}
                  className="space-y-3"
                >
                  <textarea
                    value={envContent}
                    onChange={(e) => setEnvContent(e.target.value)}
                    rows={6}
                    placeholder="KEY=VALUE"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Never share secrets in chat. Paste only environment content needed by your app.
                  </p>
                  <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-primary text-black px-4 py-2 text-sm font-bold hover:bg-white disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save .env
                      </button>
                      {savedEnvContent && (
                          <button
                            type="button"
                            onClick={() => {
                                setEnvContent(savedEnvContent);
                                setIsEnvEditing(false);
                            }}
                            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
                          >
                            Cancel
                          </button>
                      )}
                  </div>
                </form>
            ) : (
                <div className="relative group">
                    <pre className="w-full rounded-lg bg-black/40 border border-white/5 px-4 py-3 text-gray-300 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                        {envContent}
                    </pre>
                </div>
            )}
          </div>
        )}

        {/* Upload Section */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <h4 className="mb-3 text-sm font-medium text-white flex items-center gap-2">
            <Upload className="h-4 w-4" /> Upload Content
          </h4>
          <form onSubmit={handleDeploy} className="space-y-3">
            <input
              type="file"
              accept=".zip"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/20"
            />
            <p className="text-xs text-gray-500">
              Upload a .zip file containing your website (must include index.html).
            </p>
            
            {error && (
              <div className="text-sm text-red-400 flex items-center gap-2">
                 <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            
            {success && (
              <div className="text-sm text-green-400 flex items-center gap-2">
                 <CheckCircle className="h-4 w-4" /> {success}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full rounded-lg bg-white/10 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              {loading ? "Uploading..." : "Upload & Deploy"}
            </button>
          </form>
        </div>

        {/* Instructions */}
        {!(sub.site as any).serverIp && (
           <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
             <h4 className="text-sm font-medium text-yellow-400 mb-1">Waiting for IP Assignment</h4>
             <p className="text-xs text-yellow-200/70">
               Your site is ready for content. Once you upload your files, an admin will review and assign a server IP.
             </p>
           </div>
        )}
        {(sub.site as any).dbConnection && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <h4 className="text-sm font-medium text-green-400 mb-1">Database Connection</h4>
            <p className="text-xs text-gray-300 break-all font-mono">
              {(sub.site as any).dbConnection}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
