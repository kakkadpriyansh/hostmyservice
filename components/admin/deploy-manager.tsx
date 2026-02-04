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
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Configuration */}
        <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Server className="h-5 w-5 text-indigo-600" />
            Deployment Configuration
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Website</label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Source Code (ZIP)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".zip" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">ZIP up to 50MB</p>
                {file && (
                    <p className="text-sm text-green-600 font-medium mt-2">{file.name}</p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleDeploy}
            disabled={!file || !selectedSite || status === "UPLOADING" || status === "DEPLOYING"}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 flex flex-col h-[500px]">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-gray-100 font-mono text-sm flex items-center gap-2">
              <Terminal className="h-4 w-4 text-green-400" />
              Deployment Logs
            </h2>
            {status === "SUCCESS" && <span className="text-green-400 text-xs font-mono">SUCCESS</span>}
            {status === "ERROR" && <span className="text-red-400 text-xs font-mono">FAILED</span>}
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-gray-300 space-y-1">
            {logs.length === 0 ? (
                <div className="text-gray-600 italic">Waiting for deployment...</div>
            ) : (
                logs.map((log, i) => (
                    <div key={i} className="break-all border-l-2 border-transparent hover:border-gray-700 pl-2">
                        {log}
                    </div>
                ))
            )}
            {errorMessage && (
                <div className="text-red-400 mt-2 border-l-2 border-red-500 pl-2">
                    Error: {errorMessage}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
