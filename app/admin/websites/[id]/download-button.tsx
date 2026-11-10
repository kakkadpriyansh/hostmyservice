'use client';

import { Download } from "lucide-react";
import { useState } from "react";

interface DownloadButtonProps {
  deploymentId: string;
}

export function DownloadButton({ deploymentId }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/admin/deployments/${deploymentId}/download`, {
        method: 'GET',
        credentials: 'include', // This ensures cookies are sent
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('Unauthorized: Please log in as admin');
          return;
        }
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get the filename from Content-Disposition header or create a default one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `deployment_${deploymentId}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={isDownloading ? "Downloading..." : "Download Archive"}
    >
      <Download className={`h-4 w-4 ${isDownloading ? 'animate-spin' : ''}`} />
    </button>
  );
}