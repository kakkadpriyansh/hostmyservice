"use client";

import { useEffect, useState, useRef } from "react";
import {
  getClientDeploymentLogs,
  ClientDeploymentInfo,
  ClientLogEntry,
} from "@/app/actions/client/logs";
import {
  Terminal,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DeploymentLogsViewerProps {
  siteId: string;
  domain: string;
}

export function DeploymentLogsViewer({ siteId, domain }: DeploymentLogsViewerProps) {
  const [deployment, setDeployment] = useState<ClientDeploymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Latest status, read by the polling interval without re-creating it
  const statusRef = useRef<string | undefined>(undefined);

  const fetchLogs = async (isManual = false) => {
    if (isManual) setLoading(true);
    const res = await getClientDeploymentLogs(siteId);
    if (res.success && res.data) {
      setDeployment(res.data);
      statusRef.current = res.data.status;
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await getClientDeploymentLogs(siteId);
      if (cancelled) return;
      if (res.success && res.data) {
        setDeployment(res.data);
        statusRef.current = res.data.status;
      }
      setLoading(false);
    };

    load();

    // Auto-poll logs every 3 seconds while a deployment is queued or building (like Vercel live stream)
    const interval = setInterval(() => {
      const status = statusRef.current;
      if (status === undefined || status === "PENDING" || status === "BUILDING") {
        load();
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [siteId]);

  // Auto-scroll to bottom of logs when building
  useEffect(() => {
    if (deployment?.status === "BUILDING") {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [deployment?.logs.length, deployment?.status]);

  const handleCopyLogs = () => {
    if (!deployment?.logs || deployment.logs.length === 0) return;
    const text = deployment.logs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.step}] ${l.output}`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!deployment && !loading) {
    return null;
  }

  const statusBadge = () => {
    switch (deployment?.status) {
      case "DEPLOYED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Ready
          </span>
        );
      case "BUILDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00D2FF]/15 text-[#00D2FF] border border-[#00D2FF]/30 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            Building
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Queued
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header bar (Vercel-style deployment summary) */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00D2FF]/10 text-[#00D2FF] border border-[#00D2FF]/20 flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white font-mono tracking-tight">
                Build & Deployment Logs
              </h4>
              {statusBadge()}
            </div>
            {deployment && (
              <p className="text-[11px] text-blue-200/50 mt-0.5 font-mono">
                Triggered {new Date(deployment.createdAt).toLocaleString()} · Read-only
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {deployment?.logs && deployment.logs.length > 0 && (
            <button
              onClick={handleCopyLogs}
              title="Copy all logs"
              className="p-1.5 rounded-lg text-blue-200/60 hover:text-white hover:bg-white/10 transition-colors text-xs flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => fetchLogs(true)}
            title="Refresh logs"
            disabled={loading}
            className="p-1.5 rounded-lg text-blue-200/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse logs" : "Expand logs"}
            className="p-1.5 rounded-lg text-blue-200/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Terminal Content Window */}
      {isExpanded && (
        <div className="p-4 bg-[#050D24]/90 font-mono text-xs leading-relaxed max-h-72 overflow-y-auto space-y-1.5 select-text border-t border-black/40">
          {loading && !deployment ? (
            <div className="flex items-center justify-center py-8 text-blue-200/60 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#00D2FF]" />
              <span>Loading deployment stream...</span>
            </div>
          ) : !deployment?.logs || deployment.logs.length === 0 ? (
            <div className="py-6 text-center text-blue-200/40 italic">
              Deployment queued. Real-time build logs will stream here automatically once building begins.
            </div>
          ) : (
            deployment.logs.map((log: ClientLogEntry, index: number) => {
              const isError = log.status === "FAILED" || log.output.toLowerCase().includes("error");
              const isSuccess = log.status === "SUCCESS";
              const isPending = log.status === "PENDING";
              const time = new Date(log.timestamp).toLocaleTimeString();

              return (
                <div
                  key={log.id || index}
                  className={cn(
                    "flex items-start gap-2.5 py-0.5 px-2 rounded hover:bg-white/[0.04] transition-colors",
                    isError && "bg-red-500/10 text-red-300",
                    isSuccess && "text-blue-100",
                    isPending && "text-amber-200/90"
                  )}
                >
                  <span className="text-blue-300/40 text-[10px] select-none shrink-0 pt-0.5 font-mono">
                    {time}
                  </span>

                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider shrink-0 select-none",
                      isSuccess && "bg-emerald-500/20 text-emerald-300",
                      isError && "bg-red-500/20 text-red-300",
                      isPending && "bg-amber-500/20 text-amber-300",
                      !isSuccess && !isError && !isPending && "bg-white/10 text-blue-200"
                    )}
                  >
                    {log.step}
                  </span>

                  <span className="flex-1 break-all font-mono">
                    {log.output}
                  </span>
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}
