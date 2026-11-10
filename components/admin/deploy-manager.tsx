"use client";

import { useState } from "react";
import { uploadSiteArchive } from "@/app/actions/admin/upload";
import { triggerDeployment } from "@/app/actions/admin/deploy";
import { 
  Upload, 
  Server, 
  Terminal, 
  Loader2, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  FileCode, 
  Database, 
  Clock 
} from "lucide-react";

interface DeployManagerProps {
  sites: any[];
  pendingDeployments?: any[];
}

export function DeployManager({ sites, pendingDeployments = [] }: DeployManagerProps) {
  const [activeTab, setActiveTab] = useState<"PENDING" | "MANUAL">("PENDING");
  
  // Pending queue state
  const [deploymentsList, setDeploymentsList] = useState(pendingDeployments);
  const [runningDeployId, setRunningDeployId] = useState<string | null>(null);

  // Manual deployment state
  const [selectedSite, setSelectedSite] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [manualStatus, setManualStatus] = useState<"IDLE" | "UPLOADING" | "DEPLOYING" | "SUCCESS" | "ERROR">("IDLE");

  // Shared logs state
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentActionTitle, setCurrentActionTitle] = useState("Deployment Logs");

  // Handler for 1-click trigger of queued deployment
  async function handleTriggerDeployment(deploymentId: string, domainName: string) {
    if (runningDeployId) return;

    setRunningDeployId(deploymentId);
    setCurrentActionTitle(`Auto-Deploying ${domainName}`);
    setErrorMessage("");
    setLogs([
      `${new Date().toISOString()}: [Start] Initiating full automated deployment for ${domainName}...`,
      `${new Date().toISOString()}: [Status] Setting up remote directories & checking database provisioning...`
    ]);

    try {
      const res = await triggerDeployment(deploymentId);

      if ("logs" in res && res.logs) {
        setLogs(res.logs);
      }

      if (res.success) {
        setDeploymentsList((prev) => prev.filter((d) => d.id !== deploymentId));
      } else {
        setErrorMessage(res.error || "Deployment execution failed on VPS.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while triggering deployment.");
      setLogs((prev) => [...prev, `CRITICAL: ${err.message}`]);
    } finally {
      setRunningDeployId(null);
    }
  }

  // Handler for direct manual archive upload & deploy
  async function handleManualUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSite || !file) return;

    const targetSiteObj = sites.find((s) => s.id === selectedSite);
    const domainName = targetSiteObj ? targetSiteObj.domain : "Target Site";

    setManualStatus("UPLOADING");
    setCurrentActionTitle(`Manual Deploy: ${domainName}`);
    setErrorMessage("");
    setLogs([
      `${new Date().toISOString()}: [Upload] Uploading archive to HostMyService local store...`
    ]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes: any = await uploadSiteArchive(formData);

      if (!uploadRes.success || !uploadRes.uploadId) {
        throw new Error(uploadRes.error || "Failed to save file on server");
      }

      const uploadId = uploadRes.uploadId;
      setLogs((prev) => [
        ...prev,
        `${new Date().toISOString()}: [Upload] Saved archive (ID: ${uploadId}).`,
        `${new Date().toISOString()}: [Queue] Queuing automated deploy engine...`
      ]);

      setManualStatus("DEPLOYING");

      // We trigger deploy using full pipeline
      const deployRes = await fetch("/api/admin/deploy-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: selectedSite, uploadId }),
      }).then((r) => r.json()).catch(() => null);

      if (deployRes && deployRes.success) {
        setManualStatus("SUCCESS");
        if (deployRes.logs) setLogs(deployRes.logs);
      } else {
        setManualStatus("ERROR");
        setErrorMessage(deployRes?.error || "Automated deployment completed with errors. See logs.");
        if (deployRes?.logs) setLogs(deployRes.logs);
      }
    } catch (err: any) {
      setManualStatus("ERROR");
      setErrorMessage(err.message || "Manual upload failed");
      setLogs((prev) => [...prev, `ERROR: ${err.message}`]);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex border-b border-white/10 gap-8">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "PENDING"
              ? "border-[#00D2FF] text-[#00D2FF]"
              : "border-transparent text-blue-200/60 hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Client Uploads
          {deploymentsList.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-[#00D2FF] text-[#07133B] font-black">
              {deploymentsList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("MANUAL")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "MANUAL"
              ? "border-[#00D2FF] text-[#00D2FF]"
              : "border-transparent text-blue-200/60 hover:text-white"
          }`}
        >
          <Upload className="w-4 h-4" />
          Direct / Manual Upload
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Actions */}
        <div className="lg:col-span-7 space-y-4">
          {activeTab === "PENDING" ? (
            <div className="space-y-4">
              {deploymentsList.length === 0 ? (
                <div className="p-8 text-center rounded-[24px] bg-white/10 border border-white/15 text-blue-200/70 glass backdrop-blur-xl">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-90" />
                  <p className="font-bold text-white text-base">No pending deployments!</p>
                  <p className="text-xs text-blue-200/60 mt-1">All sites uploaded by clients have been deployed.</p>
                </div>
              ) : (
                deploymentsList.map((dep) => {
                  const isRunning = runningDeployId === dep.id;
                  const plan = dep.site?.subscription?.plan;
                  const hasEnv = !!dep.site?.envVars;

                  return (
                    <div 
                      key={dep.id} 
                      className="p-5 rounded-[22px] bg-white/10 border border-white/15 hover:border-white/25 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass backdrop-blur-xl shadow-xl"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white font-mono text-base">{dep.site.domain}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0047FF]/20 text-blue-300 border border-blue-400/30 font-semibold">
                            {dep.type || "ZIP"}
                          </span>
                          {plan?.dbType && plan.dbType !== "NONE" && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 flex items-center gap-1 font-semibold">
                              <Database className="w-3 h-3" /> {plan.dbType}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-blue-200/70">
                          Client: <span className="text-white font-medium">{dep.site?.user?.email || "Unknown"}</span> · Plan: <span className="text-[#00D2FF] font-semibold">{plan?.name || "Static"}</span>
                        </p>
                        <div className="flex items-center gap-3 text-xs pt-1">
                          <span className={`inline-flex items-center gap-1 font-medium ${hasEnv ? "text-emerald-300" : "text-blue-300/60"}`}>
                            <FileCode className="w-3 h-3" />
                            {hasEnv ? ".env configured" : "No custom .env"}
                          </span>
                          {plan?.providesDb && (
                            <span className="text-purple-300 inline-flex items-center gap-1 font-medium">
                              <Database className="w-3 h-3" /> Dedicated port ready
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTriggerDeployment(dep.id, dep.site.domain)}
                          disabled={isRunning || !!runningDeployId}
                          className="px-4 py-2.5 rounded-xl bg-[#00D2FF] hover:bg-white text-[#07133B] font-black text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.4)] disabled:opacity-50 transition-all hover:shadow-[0_0_20px_rgba(0,210,255,0.6)]"
                        >
                          {isRunning ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deploying...
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" /> Deploy Now
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="p-6 rounded-[24px] bg-white/10 border border-white/15 glass backdrop-blur-xl shadow-2xl">
              <h3 className="font-bold text-white text-base mb-1 font-display">Manual Direct Upload & Deploy</h3>
              <p className="text-xs text-blue-200/70 mb-4">
                Select an existing client site and upload a new ZIP archive directly to execute deploy.
              </p>

              <form onSubmit={handleManualUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-blue-100 mb-1">Select Website</label>
                  <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    required
                    className="w-full rounded-xl bg-[#061138] border border-white/20 p-2.5 text-sm text-white focus:outline-none focus:border-[#00D2FF]"
                  >
                    <option value="" className="bg-[#061138]">-- Choose domain --</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#061138]">
                        {s.domain} ({s.user?.email || "No user"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-100 mb-1">Upload ZIP Archive</label>
                  <input
                    type="file"
                    accept=".zip"
                    required
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-blue-200/80 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white/15 file:text-white hover:file:bg-[#00D2FF] hover:file:text-[#07133B] file:transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedSite || !file || manualStatus === "UPLOADING" || manualStatus === "DEPLOYING"}
                  className="w-full py-2.5 rounded-xl bg-[#00D2FF] hover:bg-white text-[#07133B] font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,210,255,0.4)] disabled:opacity-50 transition-all hover:shadow-[0_0_25px_rgba(0,210,255,0.6)]"
                >
                  {manualStatus === "UPLOADING" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading to server...
                    </>
                  ) : manualStatus === "DEPLOYING" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Executing Auto-Deploy...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Start Deployment
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Live Terminal Output */}
        <div className="lg:col-span-5 bg-[#051136]/90 rounded-[24px] border border-white/15 flex flex-col h-[520px] overflow-hidden glass backdrop-blur-2xl shadow-2xl">
          <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#00D2FF]" />
              <span className="text-xs font-bold text-white">{currentActionTitle}</span>
            </div>
            {runningDeployId && (
              <span className="flex items-center gap-1.5 text-xs text-[#00D2FF] font-semibold animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> In Progress
              </span>
            )}
          </div>

          <div className="p-4 flex-1 overflow-y-auto font-mono text-xs space-y-1 text-blue-100/90 leading-relaxed bg-black/40">
            {logs.length === 0 ? (
              <p className="text-blue-300/40 italic">Waiting for deployment trigger...</p>
            ) : (
              logs.map((line, idx) => (
                <div key={idx} className="break-all">
                  {line.includes("[SUCCESS]") || line.includes("successfully") ? (
                    <span className="text-emerald-300">{line}</span>
                  ) : line.includes("[FAILED]") || line.includes("ERROR") || line.includes("CRITICAL") ? (
                    <span className="text-red-400 font-bold">{line}</span>
                  ) : line.includes("[PENDING]") ? (
                    <span className="text-amber-300">{line}</span>
                  ) : (
                    line
                  )}
                </div>
              ))
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border-t border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
