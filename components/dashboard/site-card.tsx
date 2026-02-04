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
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {sub.domain || "No Domain Assigned"}
              </h3>
            </div>
            <p className="mt-1 text-sm text-gray-500">{sub.plan.name} Plan</p>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              sub.status === "ACTIVE"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
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
          <h4 className="text-sm font-medium text-gray-900">
            Server Information
          </h4>
          
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-3">
              <Server className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Server IP</p>
                <p className="font-mono text-sm font-medium">{SERVER_IP}</p>
              </div>
            </div>
            <button
              onClick={copyIp}
              className="rounded-md p-1.5 hover:bg-gray-200 text-gray-500"
              title="Copy IP"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-gray-500">SSL Status</p>
              <p className="text-sm font-medium text-green-700">Secured (Auto-Renew)</p>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">
            Subscription Details
          </h4>

          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Valid Until</p>
              <div className="flex items-baseline gap-2">
                <p className="text-sm font-medium">
                  {new Date(sub.endDate).toLocaleDateString()}
                </p>
                {sub.status === "ACTIVE" && (
                  <span className={cn("text-xs", daysLeft < 7 ? "text-red-600" : "text-gray-500")}>
                    ({daysLeft} days left)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Payment Status</p>
              <p className="text-sm font-medium text-green-700">Paid</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / DNS Instructions */}
      <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
        <button
          onClick={() => setShowDns(!showDns)}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <Info className="h-4 w-4" />
          {showDns ? "Hide DNS Instructions" : "View DNS Instructions"}
        </button>

        {showDns && (
          <div className="mt-4 rounded-md bg-yellow-50 p-4 border border-yellow-100">
            <h5 className="mb-2 text-sm font-semibold text-yellow-800">
              Point your domain to HostMyService
            </h5>
            <p className="mb-3 text-xs text-yellow-700">
              Add the following A Record to your domain's DNS settings:
            </p>
            <div className="overflow-x-auto rounded border border-yellow-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Host / Name</th>
                    <th className="px-3 py-2">Value / Points to</th>
                    <th className="px-3 py-2">TTL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-3 py-2 font-mono">A</td>
                    <td className="px-3 py-2 font-mono">@</td>
                    <td className="px-3 py-2 font-mono">{SERVER_IP}</td>
                    <td className="px-3 py-2">Auto / 3600</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Note: DNS propagation may take up to 24-48 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
