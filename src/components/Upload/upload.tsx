"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { clientUpload, isImageFile } from "@/lib/upload/client-upload";

interface DragDropImageUploadProps {
  onImageSelect: (url: string | null) => void;
  currentImage?: string | null;
  label?: string;
  placeholder?: string;
  onError?: (message: string) => void;
}

export default function DragDropImageUpload({
  onImageSelect,
  currentImage,
  label,
  placeholder = "PNG, JPG, GIF, WebP (max 5MB)",
  onError,
}: DragDropImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Update preview when currentImage changes (e.g., when editing)
  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (imageFile) {
      await handleImageFile(imageFile);
    }
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        await handleImageFile(file);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    []
  );

  const handleImageFile = async (file: File) => {
    // Validate it's an image
    if (!isImageFile(file)) {
      onError?.("Please select an image file (JPEG, PNG, GIF, or WebP).");
      return;
    }

    // Validate file size (max 5MB for images)
    if (file.size > 5 * 1024 * 1024) {
      onError?.("Image too large. Maximum size is 5MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Show preview immediately using local URL
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    // Upload directly to Vercel Blob (client-side)
    const result = await clientUpload(file, setUploadProgress);

    // Clean up local preview URL
    URL.revokeObjectURL(localPreview);

    if (result.success) {
      setPreview(result.url);
      onImageSelect(result.url);
    } else {
      // Upload failed, revert preview
      setPreview(currentImage || null);
      onError?.(result.error);
    }

    setIsUploading(false);
    setUploadProgress(0);
  };

  const removeImage = () => {
    setPreview(null);
    onImageSelect(null);
  };

  return (
    <div>
      {label && (
        <label className="block text-lg font-semibold mb-3 text-white rtl">
          {label}
        </label>
      )}

      {preview ? (
        <div className="relative">
          <div className="relative w-full h-48 border-2 border-gray-600 rounded-lg overflow-hidden">
            <Image src={preview} alt="Preview" fill className="object-cover" />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                {uploadProgress > 0 && (
                  <p className="mt-2 text-white text-sm">{uploadProgress}%</p>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={removeImage}
            disabled={isUploading}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700 cursor-pointer disabled:opacity-50"
          >
            ×
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative w-full h-48 border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center
            cursor-pointer transition-colors
            ${
              isUploading
                ? "border-gray-500 bg-gray-700 cursor-not-allowed"
                : isDragOver
                ? "border-blue-400 bg-gray-700"
                : "border-gray-600 hover:border-gray-500"
            }
          `}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          {isUploading ? (
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 text-blue-400 animate-spin" />
              <p className="mt-2 text-base text-gray-300">
                מעלה... {uploadProgress > 0 && `${uploadProgress}%`}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-base text-gray-300">
                <span className="font-medium text-blue-400 hover:text-blue-300">
                  לחץ להעלאה
                </span>{" "}
                או גרור ושחרר כאן
              </p>
              <p className="text-sm text-gray-400 mt-1">{placeholder}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
