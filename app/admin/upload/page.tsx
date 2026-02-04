import { FileUpload } from "@/components/admin/file-upload";

export default function AdminUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Site Archive</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload a ZIP file containing the static website files to the server.
          This will extract the files to a temporary directory for validation.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <FileUpload />
      </div>
    </div>
  );
}
