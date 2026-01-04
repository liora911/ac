"use client";

import React from "react";
import { FileText, Download, ExternalLink } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import PdfViewer to avoid SSR issues
const PdfViewer = dynamic(() => import("@/components/PdfViewer/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded-lg p-8 text-center">
      <div className="animate-pulse">Loading viewer...</div>
    </div>
  ),
});

interface DocumentViewerProps {
  url: string;
  title?: string;
  filename?: string;
}

// Get file extension from URL or filename
function getFileExtension(url: string, filename?: string): string {
  const name = filename || url.split("/").pop() || "";
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ext;
}

// Get document type info
function getDocumentInfo(extension: string): {
  type: "pdf" | "powerpoint" | "word" | "excel" | "unknown";
  label: string;
  icon: string;
  color: string;
} {
  switch (extension) {
    case "pdf":
      return { type: "pdf", label: "PDF Document", icon: "📄", color: "text-red-600" };
    case "pptx":
    case "ppt":
      return { type: "powerpoint", label: "PowerPoint Presentation", icon: "📊", color: "text-orange-600" };
    case "docx":
    case "doc":
      return { type: "word", label: "Word Document", icon: "📝", color: "text-blue-600" };
    case "xlsx":
    case "xls":
      return { type: "excel", label: "Excel Spreadsheet", icon: "📈", color: "text-green-600" };
    default:
      return { type: "unknown", label: "Document", icon: "📁", color: "text-gray-600" };
  }
}

export default function DocumentViewer({ url, title, filename }: DocumentViewerProps) {
  const extension = getFileExtension(url, filename);
  const docInfo = getDocumentInfo(extension);

  // For PDFs, use the interactive viewer
  if (docInfo.type === "pdf") {
    return <PdfViewer url={url} title={title} />;
  }

  // For other document types, show download/preview card
  // Note: Browser-based PowerPoint/Word/Excel viewers require Microsoft 365 or Google Docs API
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{docInfo.icon}</span>
          <div>
            <h3 className="font-medium text-gray-900">{title || filename || "Document"}</h3>
            <p className={`text-sm ${docInfo.color}`}>{docInfo.label}</p>
          </div>
        </div>
      </div>

      {/* Preview using Microsoft Office Online Viewer */}
      {(docInfo.type === "powerpoint" || docInfo.type === "word" || docInfo.type === "excel") && (
        <div className="aspect-video bg-gray-100">
          <iframe
            src={officeViewerUrl}
            className="w-full h-full border-0"
            title={title || "Document Preview"}
            allowFullScreen
          />
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex flex-wrap gap-3">
        <a
          href={url}
          download
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open in new tab
        </a>
        {(docInfo.type === "powerpoint" || docInfo.type === "word" || docInfo.type === "excel") && (
          <a
            href={googleViewerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FileText className="w-4 h-4" />
            View with Google Docs
          </a>
        )}
      </div>
    </div>
  );
}
