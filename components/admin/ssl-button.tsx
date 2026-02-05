"use client";

import { useState } from "react";
import { provisionSSL } from "@/app/actions/admin/ssl";
import { Shield, Loader2, RefreshCw } from "lucide-react";

export function SSLButton({ siteId, status }: { siteId: string; status: string }) {
  const [loading, setLoading] = useState(false);

  const handleProvision = async () => {
    if (!confirm("Are you sure you want to provision SSL for this site? This may take a few minutes.")) return;
    
    setLoading(true);
    try {
      const result = await provisionSSL(siteId);
      if (result.success) {
        alert("SSL Provisioning started successfully!");
        // Ideally we should refresh the page or update state
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (status === "ACTIVE") {
    return (
        <button 
            onClick={handleProvision}
            disabled={loading}
            className="text-xs text-green-600 flex items-center gap-1 hover:underline"
            title="Renew/Re-provision SSL"
        >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Renew
        </button>
    );
  }

  return (
    <button
      onClick={handleProvision}
      disabled={loading}
      className="text-primary hover:text-white transition-colors text-xs font-medium flex items-center gap-1"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
      Provision SSL
    </button>
  );
}
