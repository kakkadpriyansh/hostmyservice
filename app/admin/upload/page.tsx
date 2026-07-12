import { FileUpload } from "@/components/admin/file-upload";
import { Upload } from "lucide-react";

export default function AdminUploadPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Upload Site Archive</h1>
          <p className="text-sm text-gray-400">
            Upload a ZIP file containing static website files. Files will be extracted to a temporary directory for validation.
          </p>
        </div>
      </div>

      <div className="glass ring-1 ring-white/10 sm:rounded-2xl p-8">
        <FileUpload />
      </div>
    </div>
  );
}
