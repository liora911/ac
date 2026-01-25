"use client";

import React, { useState } from "react";
import { Plus, X, User, Upload } from "lucide-react";
import Image from "next/image";
import type { ArticleAuthorInput, AuthorInputProps } from "@/types/Articles/articles";

// Use index as key - stable across re-renders when typing

const AuthorInput: React.FC<AuthorInputProps> = ({
  authors,
  onChange,
  error,
}) => {
  const [imageInputs, setImageInputs] = useState<{ [key: number]: string }>({});

  const addAuthor = () => {
    const newAuthor: ArticleAuthorInput = {
      name: "",
      imageUrl: null,
      order: authors.length,
    };
    onChange([...authors, newAuthor]);
  };

  const removeAuthor = (index: number) => {
    if (authors.length <= 1) return; // Must have at least 1 author
    const newAuthors = authors.filter((_, i) => i !== index);
    // Re-order remaining authors
    const reorderedAuthors = newAuthors.map((author, i) => ({
      ...author,
      order: i,
    }));
    onChange(reorderedAuthors);
  };

  const updateAuthor = (
    index: number,
    field: keyof ArticleAuthorInput,
    value: string | null
  ) => {
    const newAuthors = [...authors];
    newAuthors[index] = {
      ...newAuthors[index],
      [field]: value,
    };
    onChange(newAuthors);
  };

  const handleImageUrlChange = (index: number, url: string) => {
    setImageInputs({ ...imageInputs, [index]: url });
  };

  const applyImageUrl = (index: number) => {
    const url = imageInputs[index];
    if (url && url.trim()) {
      updateAuthor(index, "imageUrl", url.trim());
    }
    setImageInputs({ ...imageInputs, [index]: "" });
  };

  const clearImage = (index: number) => {
    updateAuthor(index, "imageUrl", null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          מחברים <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={addAuthor}
          className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          הוסף מחבר
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-3">
        {authors.map((author, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300">
                {author.imageUrl ? (
                  <Image
                    src={author.imageUrl}
                    alt={author.name || "Author"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300">
                    <User className="w-7 h-7 text-gray-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Author Details */}
            <div className="flex-1 space-y-2">
              {/* Name Input */}
              <input
                type="text"
                value={author.name}
                onChange={(e) => updateAuthor(index, "name", e.target.value)}
                placeholder="שם המחבר *"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                required
              />

              {/* Image URL Input */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageInputs[index] || ""}
                  onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  placeholder="כתובת URL לתמונה (אופציונלי)"
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs"
                />
                <button
                  type="button"
                  onClick={() => applyImageUrl(index)}
                  disabled={!imageInputs[index]?.trim()}
                  className="px-2 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                </button>
                {author.imageUrl && (
                  <button
                    type="button"
                    onClick={() => clearImage(index)}
                    className="px-2 py-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-xs cursor-pointer"
                    title="הסר תמונה"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {author.imageUrl && (
                <p className="text-xs text-gray-500 truncate">
                  תמונה: {author.imageUrl}
                </p>
              )}
            </div>

            {/* Remove Button */}
            {authors.length > 1 && (
              <button
                type="button"
                onClick={() => removeAuthor(index)}
                className="flex-shrink-0 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full cursor-pointer"
                title="הסר מחבר"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {authors.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          יש להוסיף לפחות מחבר אחד
        </p>
      )}
    </div>
  );
};

export default AuthorInput;
