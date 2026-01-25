"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { clientUpload, isDocumentFile, formatFileSize } from "@/lib/upload/client-upload";
import type { PdfUploadProps } from "@/types/Components/components";

export default function PdfUpload({
  pdfUrl,
  onChange,
  labels = {},
  onError,
}: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    title = "PDF Presentation",
    dragDropText = "Drag & drop PDF here",
    orClickToUpload = "or click to select file",
    maxFileSize = "Max 50MB (PDF, PPTX, DOCX, XLSX)",
    invalidFileType = "Please select a valid document file (PDF, PPTX, DOCX, XLSX)",
    removeButton = "Remove",
    viewPdf = "View File",
  } = labels;

  const handleFileUpload = useCallback(async (file: File) => {
    if (!isDocumentFile(file)) {
      onError?.(invalidFileType);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      onError?.("File too large. Maximum size is 50MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Upload directly to Vercel Blob (client-side, bypasses serverless limits)
    const result = await clientUpload(file, setUploadProgress);

    setIsUploading(false);
    setUploadProgress(0);

    if (result.success) {
      onChange(result.url);
    } else {
      onError?.(result.error);
    }
  }, [invalidFileType, onChange, onError]);

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
            accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 mx-auto mb-3 text-blue-500 animate-spin" />
              <p className="text-gray-600 font-medium">
                Uploading... {uploadProgress > 0 && `${uploadProgress}%`}
              </p>
              {uploadProgress > 0 && (
                <div className="mt-3 w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
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
