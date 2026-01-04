"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Link as LinkIcon, Loader2 } from "lucide-react";
import { clientUpload, isImageFile } from "@/lib/upload/client-upload";

interface MultiImageUploadProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
  labels?: {
    title?: string;
    uploadMode?: string;
    urlMode?: string;
    dragDropText?: string;
    orClickToUpload?: string;
    maxFileSize?: string;
    noImagesYet?: string;
    addImageButton?: string;
    removeImageButton?: string;
    uploadError?: string;
    invalidFileType?: string;
  };
  onError?: (message: string) => void;
}

export default function MultiImageUpload({
  imageUrls,
  onChange,
  labels = {},
  onError,
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Set<number>>(new Set());
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    title = "Images",
    uploadMode = "Upload",
    urlMode = "URL",
    dragDropText = "Drag & drop images here",
    orClickToUpload = "or click to select files",
    maxFileSize = "Max 5MB per image (JPEG, PNG, GIF, WebP)",
    noImagesYet = "No images added yet. Click the button below to add URLs.",
    addImageButton = "Add Image URL",
    removeImageButton = "Remove",
    uploadError = "Failed to upload image",
    invalidFileType = "Please select valid image files (max 5MB each)",
  } = labels;

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    // Upload directly to Vercel Blob (client-side, bypasses serverless limits)
    const result = await clientUpload(file);

    if (result.success) {
      return result.url;
    } else {
      onError?.(result.error);
      return null;
    }
  }, [onError]);

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file =>
      file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length === 0) {
      onError?.(invalidFileType);
      return;
    }

    // Add placeholder entries for uploading images
    const startIndex = imageUrls.length;
    const placeholders = validFiles.map(() => "");
    onChange([...imageUrls, ...placeholders]);

    // Track which images are uploading
    const newUploading = new Set(uploadingImages);
    validFiles.forEach((_, i) => newUploading.add(startIndex + i));
    setUploadingImages(newUploading);

    // Upload each file
    const newUrls = [...imageUrls, ...placeholders];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const url = await uploadFile(file);

      if (url) {
        newUrls[startIndex + i] = url;
        onChange([...newUrls]);
      } else {
        // Remove failed upload placeholder
        newUrls.splice(startIndex + i, 1, "");
      }

      // Remove from uploading set
      setUploadingImages(prev => {
        const next = new Set(prev);
        next.delete(startIndex + i);
        return next;
      });
    }

    // Clean up any empty placeholders from failed uploads
    onChange(newUrls.filter(url => url !== ""));
  }, [imageUrls, uploadFile, uploadingImages, invalidFileType, onChange, onError]);

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
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [handleFileUpload]);

  const handleImageUrlChange = (index: number, value: string) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = value;
    onChange(newImageUrls);
  };

  const addImageUrl = () => {
    onChange([...imageUrls, ""]);
  };

  const removeImageUrl = (index: number) => {
    const newImageUrls = imageUrls.filter((_, i) => i !== index);
    onChange(newImageUrls);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {title}
      </label>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setImageInputMode("upload")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
            imageInputMode === "upload"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Upload className="w-4 h-4" />
          {uploadMode}
        </button>
        <button
          type="button"
          onClick={() => setImageInputMode("url")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
            imageInputMode === "url"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          {urlMode}
        </button>
      </div>

      {/* Upload Mode - Drag & Drop Area */}
      {imageInputMode === "upload" && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
          <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
          <p className="text-gray-600 font-medium">
            {dragDropText}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {orClickToUpload}
          </p>
          <p className="text-gray-400 text-xs mt-2">
            {maxFileSize}
          </p>
        </div>
      )}

      {/* URL Mode - Manual URL Input */}
      {imageInputMode === "url" && (
        <div className="mb-4">
          {imageUrls.length === 0 && (
            <p className="text-gray-500 text-sm mb-2">
              {noImagesYet}
            </p>
          )}
          <button
            type="button"
            onClick={addImageUrl}
            className="w-full p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            {addImageButton}
          </button>
        </div>
      )}

      {/* Image Preview Grid */}
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative group">
              {uploadingImages.has(index) || !url ? (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={url}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImageUrl(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-700"
                    title={removeImageButton}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
              {/* URL input for editing (only in URL mode) */}
              {imageInputMode === "url" && url && (
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  className="mt-1 w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
