"use client";

import React from "react";
import { User, Plus } from "lucide-react";
import Image from "next/image";
import { ArticleAuthor } from "@/types/Articles/articles";

interface AuthorAvatarsProps {
  authors: ArticleAuthor[];
  size?: "sm" | "md" | "lg";
  showNames?: boolean;
  maxDisplay?: number;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

const iconSizes = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

const overlapClasses = {
  sm: "-ml-2",
  md: "-ml-3",
  lg: "-ml-4",
};

const AuthorAvatars: React.FC<AuthorAvatarsProps> = ({
  authors,
  size = "md",
  showNames = false,
  maxDisplay = 2,
}) => {
  if (!authors || authors.length === 0) {
    return null;
  }

  const displayedAuthors = authors.slice(0, maxDisplay);
  const remainingCount = authors.length - maxDisplay;
  const hasMore = remainingCount > 0;

  // Single author - simple display
  if (authors.length === 1) {
    const author = authors[0];
    return (
      <div className="flex items-center gap-2">
        <div
          className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex-shrink-0`}
        >
          {author.imageUrl ? (
            <Image
              src={author.imageUrl}
              alt={author.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
              <User className={`${iconSizes[size]} text-gray-600`} />
            </div>
          )}
        </div>
        {showNames && (
          <span className="text-sm text-gray-600 truncate max-w-[120px]">
            {author.name}
          </span>
        )}
      </div>
    );
  }

  // Multiple authors - overlapping avatars
  return (
    <div className="flex items-center">
      <div className="flex items-center">
        {displayedAuthors.map((author, index) => (
          <div
            key={author.id}
            className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex-shrink-0 ${
              index > 0 ? overlapClasses[size] : ""
            }`}
            style={{ zIndex: displayedAuthors.length - index }}
            title={author.name}
          >
            {author.imageUrl ? (
              <Image
                src={author.imageUrl}
                alt={author.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                <User className={`${iconSizes[size]} text-gray-600`} />
              </div>
            )}
          </div>
        ))}

        {/* Show +N indicator if more than maxDisplay authors */}
        {hasMore && (
          <div
            className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gray-700 border-2 border-white shadow-sm flex-shrink-0 ${overlapClasses[size]} flex items-center justify-center`}
            style={{ zIndex: 0 }}
            title={`+${remainingCount} מחברים נוספים`}
          >
            <span className="text-white text-xs font-medium flex items-center">
              <Plus className="w-2 h-2" />
              {remainingCount}
            </span>
          </div>
        )}
      </div>

      {showNames && (
        <span className="text-sm text-gray-600 mr-2 truncate max-w-[150px]">
          {authors.length === 2
            ? `${authors[0].name} ו${authors[1].name}`
            : `${authors[0].name} ועוד ${authors.length - 1}`}
        </span>
      )}
    </div>
  );
};

export default AuthorAvatars;
