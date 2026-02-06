"use client";

import { useState } from "react";
import { updateServerIp } from "@/app/actions/admin/websites";
import { Server, Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServerIpEditorProps {
  siteId: string;
  initialIp: string | null;
}

export function ServerIpEditor({ siteId, initialIp }: ServerIpEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [ip, setIp] = useState(initialIp || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateServerIp(siteId, ip);
      if (!res.success) {
        setError(res.error || "Failed to update IP");
      } else {
        setIsEditing(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIp(initialIp || "");
    setIsEditing(false);
    setError(null);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 min-w-[200px]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="192.168.1.1"
            className="w-full rounded bg-white/10 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded p-1 text-green-400 hover:bg-white/10 transition-colors"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="rounded p-1 text-red-400 hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <div className={cn(
        "flex items-center gap-2 rounded-full px-2 py-1 text-sm font-mono",
        initialIp ? "bg-blue-500/10 text-blue-400" : "bg-gray-500/10 text-gray-400 italic"
      )}>
        <Server className="h-3 w-3" />
        {initialIp || "Unassigned"}
      </div>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
        title="Edit Server IP"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}
