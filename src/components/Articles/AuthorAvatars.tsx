"use client";

import React, { useState } from "react";
import { User, Plus, X } from "lucide-react";
import Image from "next/image";
import { ArticleAuthor } from "@/types/Articles/articles";

interface AuthorAvatarsProps {
  authors: ArticleAuthor[];
  size?: "sm" | "md" | "lg";
  showNames?: boolean;
  maxDisplay?: number;
  clickable?: boolean;
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

// Use both -ml and -mr for RTL/LTR support
const overlapClasses = {
  sm: "-ml-2 rtl:-mr-2 rtl:ml-0",
  md: "-ml-3 rtl:-mr-3 rtl:ml-0",
  lg: "-ml-4 rtl:-mr-4 rtl:ml-0",
};

const AuthorAvatars: React.FC<AuthorAvatarsProps> = ({
  authors,
  size = "md",
  showNames = false,
  maxDisplay = 2,
  clickable = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!authors || authors.length === 0) {
    return null;
  }

  const displayedAuthors = authors.slice(0, maxDisplay);
  const remainingCount = authors.length - maxDisplay;
  const hasMore = remainingCount > 0;

  const handleClick = () => {
    if (clickable) {
      setIsModalOpen(true);
    }
  };

  const renderAvatar = (author: ArticleAuthor, index: number, total: number) => (
    <div
      key={author.id}
      className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex-shrink-0 ${
        index > 0 ? overlapClasses[size] : ""
      }`}
      style={{ zIndex: total - index }}
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
  );

  return (
    <>
      <div
        className={`flex items-center ${clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
        onClick={handleClick}
      >
        <div className="flex items-center">
          {displayedAuthors.map((author, index) =>
            renderAvatar(author, index, displayedAuthors.length)
          )}

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
            {authors.length === 1
              ? authors[0].name
              : authors.length === 2
              ? `${authors[0].name} ו${authors[1].name}`
              : `${authors[0].name} ועוד ${authors.length - 1}`}
          </span>
        )}
      </div>

      {/* Authors Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                מחברים ({authors.length})
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Authors List */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
              {authors.map((author) => (
                <div
                  key={author.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300 flex-shrink-0">
                    {author.imageUrl ? (
                      <Image
                        src={author.imageUrl}
                        alt={author.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {author.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthorAvatars;
