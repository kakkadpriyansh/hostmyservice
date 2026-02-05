"use client";

import {
  Globe,
  Server,
  ShieldCheck,
  Calendar,
  CreditCard,
  Info,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SubscriptionWithPlan } from "@/types";

// Mock server IP - in a real app this might come from env or DB
const SERVER_IP = "192.168.1.100";

export function SiteCard({ sub }: { sub: SubscriptionWithPlan }) {
  const [showDns, setShowDns] = useState(false);
  const [copied, setCopied] = useState(false);

  const daysLeft = Math.ceil(
    (new Date(sub.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const copyIp = () => {
    navigator.clipboard.writeText(SERVER_IP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {sub.domain || "No Domain Assigned"}
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-400 ml-11">{sub.plan.name} Plan</p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold border",
              sub.status === "ACTIVE"
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            )}
          >
            {sub.status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 p-6 sm:grid-cols-2">
        {/* Server Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
            Server Information
          </h4>
          
          <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 p-3">
            <div className="flex items-center gap-3">
              <Server className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Server IP</p>
                <p className="font-mono text-sm font-medium text-white">{SERVER_IP}</p>
              </div>
            </div>
            <button
              onClick={copyIp}
              className="rounded-lg p-2 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Copy IP"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 p-3">
            <ShieldCheck className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-xs text-gray-500">SSL Status</p>
              <p className="text-sm font-medium text-green-400">Secured (Auto-Renew)</p>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                Subscription
            </h4>
            
            <div className="rounded-xl bg-white/5 border border-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>Expires</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                        {new Date(sub.endDate).toLocaleDateString()}
                    </span>
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <CreditCard className="h-4 w-4" />
                        <span>Days Left</span>
                    </div>
                    <span className={cn(
                        "text-sm font-bold",
                        daysLeft < 7 ? "text-red-400" : "text-primary"
                    )}>
                        {daysLeft} Days
                    </span>
                </div>
            </div>

             <button
              onClick={() => setShowDns(!showDns)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Info className="h-3 w-3" />
              {showDns ? "Hide DNS Instructions" : "Show DNS Instructions"}
            </button>
        </div>
      </div>

       {/* DNS Instructions */}
       {showDns && (
        <div className="border-t border-white/10 bg-white/5 p-6 animate-fade-in">
          <h4 className="mb-3 text-sm font-bold text-white">DNS Configuration</h4>
          <p className="mb-4 text-xs text-gray-400">
            Add these records to your domain's DNS settings to connect your domain.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-black/40 p-3 border border-white/10">
              <div className="flex items-center gap-4">
                <span className="w-12 text-xs font-bold text-gray-500">A</span>
                <span className="font-mono text-xs text-primary">@</span>
              </div>
              <span className="font-mono text-xs text-white">{SERVER_IP}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-black/40 p-3 border border-white/10">
              <div className="flex items-center gap-4">
                <span className="w-12 text-xs font-bold text-gray-500">CNAME</span>
                <span className="font-mono text-xs text-primary">www</span>
              </div>
              <span className="font-mono text-xs text-white">
                {sub.domain || "yourdomain.com"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}