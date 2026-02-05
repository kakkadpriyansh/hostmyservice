"use client";

import { useState, useRef } from "react";
import { Upload, X, FileArchive, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { uploadSiteArchive } from "@/app/actions/admin/upload";
import { cn } from "@/lib/utils";

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; path?: string; error?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setResult(null);
    if (!file.name.endsWith(".zip") && file.type !== "application/zip" && file.type !== "application/x-zip-compressed") {
      setResult({ error: "Only ZIP files are allowed." });
      return;
    }
    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadSiteArchive(formData);
      setResult(res);
      if (res.success) {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (error) {
      setResult({ error: "An unexpected error occurred." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all text-center cursor-pointer glass",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-white/10 hover:border-primary/50 hover:bg-white/5",
          file ? "bg-white/5" : "bg-transparent"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={handleFileChange}
        />

        {file ? (
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileArchive className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setResult(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium text-white">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-400 mt-1">ZIP archive containing your static site (must include index.html)</p>
            </div>
          </div>
        )}
      </div>

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-3 px-4 bg-primary text-black font-bold rounded-full hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading & Extracting...
            </>
          ) : (
            "Upload Site Archive"
          )}
        </button>
      )}

      {result && (
        <div
          className={cn(
            "p-4 rounded-lg flex items-start gap-3 border",
            result.success 
              ? "bg-green-500/10 text-green-400 border-green-500/20" 
              : "bg-red-500/10 text-red-400 border-red-500/20"
          )}
        >
          {result.success ? (
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium">{result.success ? "Upload Successful" : "Upload Failed"}</p>
            <p className="text-sm mt-1 opacity-90">{result.message || result.error}</p>
            {result.path && (
              <div className="mt-2 text-xs font-mono bg-black/50 p-2 rounded text-gray-300">
                Path: {result.path}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
