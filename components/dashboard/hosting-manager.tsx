"use client";

import { useState } from "react";
import { SubscriptionWithPlan } from "@/types";
import { createSite } from "@/app/actions/client/sites";
import { saveEnvVars } from "@/app/actions/client/sites";
import { deploySite } from "@/app/actions/client/deploy";
import { Globe, Upload, Server, CheckCircle, AlertCircle, Loader2, Pencil, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeploymentLogsViewer } from "@/components/dashboard/deployment-logs-viewer";

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
  const [deployType, setDeployType] = useState<"ZIP" | "GIT">("ZIP");
  const [file, setFile] = useState<File | null>(null);
  const [gitRepoUrl, setGitRepoUrl] = useState("");
  const [gitBranch, setGitBranch] = useState("main");

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
    if (!sub.site) return;
    
    if (deployType === "ZIP" && !file) return;
    if (deployType === "GIT" && !gitRepoUrl) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("siteId", sub.site.id);
    formData.append("type", deployType);
    
    if (deployType === "ZIP" && file) {
      formData.append("file", file);
    } else if (deployType === "GIT") {
      formData.append("gitRepoUrl", gitRepoUrl);
      formData.append("gitBranch", gitBranch);
    }

    try {
      const res = await deploySite(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Deployment queued! Waiting for admin approval.");
        setFile(null);
        setGitRepoUrl("");
        setGitBranch("main");
      }
    } catch (err) {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  if (!sub.site) {
    return (
      <div className="glass rounded-[24px] border border-white/15 bg-white/10 shadow-2xl p-8 backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00D2FF]/20 text-[#00D2FF] border border-[#00D2FF]/30">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-display text-white">Setup Hosting</h3>
            <p className="text-sm text-blue-200/70">
              Connect a domain to start hosting with your {sub.plan.name} plan.
            </p>
          </div>
        </div>

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-blue-100">
              Domain Name
            </label>
            <input
              type="text"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-blue-200/40 focus:border-[#00D2FF] focus:outline-none focus:ring-2 focus:ring-[#00D2FF]/40 transition-all text-sm"
              required
            />
          </div>

          <div className="rounded-xl border border-blue-400/20 bg-[#0047FF]/15 p-4 text-xs text-blue-200 leading-relaxed">
            <p className="font-semibold text-white mb-1">DNS Instructions:</p>
            You will need to point your domain&apos;s A record to our server IP once assigned.
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00D2FF] hover:bg-white py-3 font-bold text-[#07133B] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:shadow-[0_0_30px_rgba(0,210,255,0.6)]"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Initialize Site"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-white/15 bg-white/10 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00D2FF]/20 text-[#00D2FF] border border-[#00D2FF]/30">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-display text-white">{(sub.site as any).domain}</h3>
            <div className="flex items-center gap-2 mt-1">
               <span className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  (sub.site as any).serverIp ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
               )}>
                 {(sub.site as any).serverIp ? "Active" : "Pending Assignment"}
               </span>
               {(sub.site as any).serverIp && (
                 <span className="text-xs text-blue-200/70 font-mono">
                   {(sub.site as any).serverIp}
                 </span>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {sub.plan.requiresEnv && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">Environment Variables (.env)</h4>
                {!isEnvEditing && (
                    <button
                        onClick={() => setIsEnvEditing(true)}
                        className="text-xs flex items-center gap-1.5 font-bold text-[#00D2FF] hover:text-white transition-colors"
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
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder:text-blue-200/40 focus:border-[#00D2FF] focus:outline-none focus:ring-1 focus:ring-[#00D2FF] font-mono text-sm"
                  />
                  <p className="text-xs text-blue-200/60">
                    Never share secrets in chat. Paste only environment content needed by your app.
                  </p>
                  <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-[#00D2FF] text-[#07133B] px-4 py-2 text-sm font-bold hover:bg-white disabled:opacity-50 flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,210,255,0.3)]"
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
                            className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                          >
                            Cancel
                          </button>
                      )}
                  </div>
                </form>
            ) : (
                <div className="relative group">
                    <pre className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-blue-100 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                        {envContent || "# No environment variables set"}
                    </pre>
                </div>
            )}
          </div>
        )}

        {/* Deployment Section */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <h4 className="mb-3 text-sm font-semibold text-white flex items-center gap-2">
            <Upload className="h-4 w-4 text-[#00D2FF]" /> Deploy Content
          </h4>
          
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => setDeployType("ZIP")}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-xl border transition-all",
                deployType === "ZIP" 
                  ? "bg-[#00D2FF] border-[#00D2FF] text-[#07133B] shadow-[0_0_15px_rgba(0,210,255,0.3)]" 
                  : "bg-white/5 border-white/15 text-blue-200/70 hover:bg-white/10 hover:text-white"
              )}
            >
              ZIP Upload
            </button>
            <button
              type="button"
              onClick={() => setDeployType("GIT")}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-xl border transition-all",
                deployType === "GIT" 
                  ? "bg-[#00D2FF] border-[#00D2FF] text-[#07133B] shadow-[0_0_15px_rgba(0,210,255,0.3)]" 
                  : "bg-white/5 border-white/15 text-blue-200/70 hover:bg-white/10 hover:text-white"
              )}
            >
              Git Repository
            </button>
          </div>

          <form onSubmit={handleDeploy} className="space-y-4">
            {deployType === "ZIP" ? (
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-blue-200/80 file:mr-4 file:rounded-xl file:border-0 file:bg-white/15 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-[#00D2FF] hover:file:text-[#07133B] file:transition-colors"
                />
                <p className="text-xs text-blue-200/60">
                  Upload a .zip file containing your website or app. Nested folders are automatically detected.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-blue-200/80 mb-1">Git Repository URL</label>
                  <input
                    type="url"
                    required
                    value={gitRepoUrl}
                    onChange={(e) => setGitRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repo.git"
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white focus:border-[#00D2FF] focus:outline-none text-sm placeholder:text-blue-200/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-200/80 mb-1">Branch</label>
                  <input
                    type="text"
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    placeholder="main"
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white focus:border-[#00D2FF] focus:outline-none text-sm placeholder:text-blue-200/40"
                  />
                </div>
              </div>
            )}
            
            {error && (
              <div className="text-sm text-red-300 flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                 <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            
            {success && (
              <div className="text-sm text-emerald-300 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                 <CheckCircle className="h-4 w-4 shrink-0" /> {success}
              </div>
            )}

            <button
              type="submit"
              disabled={(deployType === "ZIP" && !file) || (deployType === "GIT" && !gitRepoUrl) || loading}
              className="w-full rounded-xl bg-[#00D2FF] py-2.5 text-sm font-bold text-[#07133B] hover:bg-white disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(0,210,255,0.3)] hover:shadow-[0_0_25px_rgba(0,210,255,0.5)]"
            >
              {loading ? "Queuing..." : "Queue Deployment"}
            </button>
          </form>
        </div>

        {/* Read-Only Live Deployment & Build Logs (Vercel Style) */}
        {sub.site && (
          <DeploymentLogsViewer
            siteId={sub.site.id}
            domain={(sub.site as any).domain}
          />
        )}

        {/* Instructions */}
        {!(sub.site as any).serverIp && (
           <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
             <h4 className="text-sm font-bold text-amber-300 mb-1">Waiting for IP Assignment</h4>
             <p className="text-xs text-amber-200/80 leading-relaxed">
               Your site is ready for content. Once you upload your files, an admin will review and assign a server IP.
             </p>
           </div>
        )}
        {(sub.site as any).dbConnection && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <h4 className="text-sm font-bold text-emerald-300 mb-1">Database Connection String</h4>
            <p className="text-xs text-emerald-100 break-all font-mono bg-black/40 p-2.5 rounded-lg border border-emerald-500/20 mt-1">
              {(sub.site as any).dbConnection}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
