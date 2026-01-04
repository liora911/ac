"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";

interface PdfUploadProps {
  pdfUrl: string | null;
  onChange: (url: string | null) => void;
  labels?: {
    title?: string;
    dragDropText?: string;
    orClickToUpload?: string;
    maxFileSize?: string;
    uploadError?: string;
    invalidFileType?: string;
    removeButton?: string;
    viewPdf?: string;
  };
  onError?: (message: string) => void;
}

export default function PdfUpload({
  pdfUrl,
  onChange,
  labels = {},
  onError,
}: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    title = "PDF Presentation",
    dragDropText = "Drag & drop PDF here",
    orClickToUpload = "or click to select file",
    maxFileSize = "Max 50MB (PDF only)",
    uploadError = "Failed to upload PDF",
    invalidFileType = "Please select a valid PDF file",
    removeButton = "Remove",
    viewPdf = "View PDF",
  } = labels;

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Upload error:", error);
      onError?.(error instanceof Error ? error.message : uploadError);
      return null;
    }
  }, [uploadError, onError]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      onError?.(invalidFileType);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      onError?.("File too large. Maximum size is 50MB.");
      return;
    }

    setIsUploading(true);
    const url = await uploadFile(file);
    setIsUploading(false);

    if (url) {
      onChange(url);
    }
  }, [uploadFile, invalidFileType, onChange, onError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [handleFileUpload]);

  const handleRemove = () => {
    onChange(null);
  };

  // Extract filename from URL
  const getFilename = (url: string) => {
    const parts = url.split("/");
    return parts[parts.length - 1];
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {title}
      </label>

      {pdfUrl ? (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                  {getFilename(pdfUrl)}
                </p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {viewPdf}
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors cursor-pointer"
              title={removeButton}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isUploading
              ? "border-gray-300 bg-gray-50 cursor-not-allowed"
              : isDragging
              ? "border-blue-500 bg-blue-50 cursor-pointer"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 mx-auto mb-3 text-blue-500 animate-spin" />
              <p className="text-gray-600 font-medium">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
              <p className="text-gray-600 font-medium">{dragDropText}</p>
              <p className="text-gray-400 text-sm mt-1">{orClickToUpload}</p>
              <p className="text-gray-400 text-xs mt-2">{maxFileSize}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
