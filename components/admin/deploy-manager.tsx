"use client";

import { useState } from "react";
import { uploadSiteArchive } from "@/app/actions/admin/upload";
import { deploySite } from "@/app/actions/admin/deploy";
import { Upload, Server, Terminal, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface DeployManagerProps {
  sites: any[];
}

export function DeployManager({ sites }: DeployManagerProps) {
  const [selectedSite, setSelectedSite] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"IDLE" | "UPLOADING" | "DEPLOYING" | "SUCCESS" | "ERROR">("IDLE");
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDeploy = async () => {
    if (!file || !selectedSite) return;

    setStatus("UPLOADING");
    setLogs(["Starting upload process..."]);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload
      const uploadRes = await uploadSiteArchive(formData);
      if (!uploadRes.success || !uploadRes.path) {
        throw new Error(uploadRes.error || "Upload failed");
      }
      setLogs(prev => [...prev, "Upload successful.", "Starting deployment..."]);
      
      setStatus("DEPLOYING");

      // 2. Deploy
      const deployRes = await deploySite(selectedSite, uploadRes.path);
      
      if (deployRes.logs) {
        setLogs(prev => [...prev, ...deployRes.logs!]);
      }

      if (!deployRes.success) {
        throw new Error(deployRes.error || "Deployment failed");
      }

      setStatus("SUCCESS");
      setLogs(prev => [...prev, "Deployment completed successfully!"]);

    } catch (error: any) {
      setStatus("ERROR");
      setErrorMessage(error.message);
      setLogs(prev => [...prev, `Error: ${error.message}`]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Configuration */}
        <div className="space-y-6 glass p-6 rounded-xl border border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
            <Server className="h-5 w-5 text-[#00f0ff]" />
            Deployment Configuration
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Select Website</label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="block w-full rounded-md border-white/10 bg-[#0A0A0A] text-white shadow-sm focus:border-[#00f0ff] focus:ring-[#00f0ff] sm:text-sm p-2 border"
            >
              <option value="">-- Choose a website --</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.domain} ({site.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Upload Source Code (ZIP)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white/10 border-dashed rounded-md hover:bg-white/5 transition-colors group">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-500 group-hover:text-[#00f0ff] transition-colors" />
                <div className="flex text-sm text-gray-400">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-[#00f0ff] hover:text-[#7000ff] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#00f0ff] transition-colors">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".zip" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">ZIP up to 50MB</p>
                {file && (
                  <p className="text-sm text-[#00f0ff] font-medium mt-2">{file.name}</p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleDeploy}
            disabled={!file || !selectedSite || status === "UPLOADING" || status === "DEPLOYING"}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-[0_0_20px_rgba(0,240,255,0.3)] text-sm font-medium text-black bg-[#00f0ff] hover:bg-[#00f0ff]/90 hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00f0ff] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300"
          >
            {status === "UPLOADING" || status === "DEPLOYING" ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                </>
            ) : (
                <>
                    <Upload className="h-4 w-4" />
                    Deploy Now
                </>
            )}
          </button>
        </div>

        {/* Logs Console */}
        <div className="bg-[#050505] rounded-xl shadow-lg border border-white/10 flex flex-col h-[500px]">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h2 className="text-gray-100 font-mono text-sm flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#00f0ff]" />
              Deployment Logs
            </h2>
            {status === "SUCCESS" && <span className="text-[#00f0ff] text-xs font-mono">SUCCESS</span>}
            {status === "ERROR" && <span className="text-[#ff003c] text-xs font-mono">FAILED</span>}
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-gray-300 space-y-1 custom-scrollbar">
            {logs.length === 0 ? (
                <div className="text-gray-600 italic">Waiting for deployment...</div>
            ) : (
                logs.map((log, i) => (
                    <div key={i} className="break-all border-l-2 border-transparent hover:border-white/20 pl-2 transition-colors">
                        {log}
                    </div>
                ))
            )}
            {errorMessage && (
                <div className="text-[#ff003c] mt-2 border-l-2 border-[#ff003c] pl-2">
                    Error: {errorMessage}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
