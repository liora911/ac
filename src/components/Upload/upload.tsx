"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

interface DragDropImageUploadProps {
  onImageSelect: (file: File) => void;
  currentImage?: string;
  label: string;
  placeholder: string;
}

export default function DragDropImageUpload({
  onImageSelect,
  currentImage,
  label,
  placeholder,
}: DragDropImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (imageFile) {
      handleImageFile(imageFile);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleImageFile(file);
      }
    },
    []
  );

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelect(file);
  };

  const removeImage = () => {
    setPreview(null);
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
          </div>
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
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
              isDragOver
                ? "border-blue-400 bg-gray-700"
                : "border-gray-600 hover:border-gray-500"
            }
          `}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

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
        </div>
      )}
    </div>
  );
}
