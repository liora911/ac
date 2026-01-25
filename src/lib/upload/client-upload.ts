import { upload } from "@vercel/blob/client";
import type { ClientUploadResult } from "@/types/Upload/upload";

export type { ClientUploadResult };

// Allowed file types (must match server-side validation)
const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const documentTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
];

export function isAllowedFileType(file: File): boolean {
  return [...imageTypes, ...documentTypes].includes(file.type);
}

export function isImageFile(file: File): boolean {
  return imageTypes.includes(file.type);
}

export function isDocumentFile(file: File): boolean {
  return documentTypes.includes(file.type);
}

export function getMaxFileSize(file: File): number {
  return isDocumentFile(file) ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * Upload a file directly to Vercel Blob from the client.
 * This bypasses serverless function size limits.
 */
export async function clientUpload(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ClientUploadResult> {
  // Client-side validation
  if (!isAllowedFileType(file)) {
    return {
      success: false,
      error:
        "Invalid file type. Allowed: images (JPEG, PNG, GIF, WebP) and documents (PDF, PPTX, DOCX, XLSX).",
    };
  }

  const maxSize = getMaxFileSize(file);
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      success: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "bin";
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Upload directly to Vercel Blob
    const blob = await upload(filename, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      },
    });

    return {
      success: true,
      url: blob.url,
      filename,
    };
  } catch (error) {
    console.error("Client upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
