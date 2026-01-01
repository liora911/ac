"use client";

import React from "react";
import { PresentationCategory } from "@/types/Presentations/presentations";
import { Folder, FolderTree, ChevronRight } from "lucide-react";

interface PresentationCategoryTreeProps {
  categories: PresentationCategory[];
  onSelectCategory: (category: PresentationCategory) => void;
  level?: number;
  expandedCategories: { [key: string]: boolean };
  toggleCategory: (categoryId: string) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryIdDirectly: (categoryId: string) => void;
}

const PresentationCategoryTree: React.FC<PresentationCategoryTreeProps> = ({
  categories,
  onSelectCategory,
  level = 0,
  expandedCategories,
  toggleCategory,
  selectedCategoryId,
  setSelectedCategoryIdDirectly,
}) => {
  return (
    <ul
      className="space-y-2"
      style={{ marginLeft: level * 16, marginTop: level > 0 ? 8 : 0 }}
    >
      {categories.map((category) => {
        const hasSubcategories =
          category.subcategories && category.subcategories.length > 0;
        const isExpanded = expandedCategories[category.id];

        return (
          <li key={category.id}>
            <div
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-300
  ${
    selectedCategoryId === category.id
      ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30"
      : "bg-slate-800/50 text-white hover:bg-gradient-to-br hover:from-blue-500/30 hover:to-purple-600/30 hover:shadow-md hover:shadow-blue-500/10"
  }`}
            >
              {/* Folder icon - different icon if has subcategories */}
              <span className="me-2 flex-shrink-0">
                {hasSubcategories ? (
                  <FolderTree size={18} className="text-amber-400" />
                ) : (
                  <Folder size={18} className="text-blue-400" />
                )}
              </span>
              <span
                className="flex-grow font-medium cursor-pointer"
                onClick={() => {
                  onSelectCategory(category);
                  setSelectedCategoryIdDirectly(category.id);
                  if (hasSubcategories) {
                    toggleCategory(category.id);
                  }
                }}
              >
                {category.name} ({category.presentations.length})
                {hasSubcategories && (
                  <span className="ms-1 text-xs opacity-70">
                    +{category.subcategories!.length}
                  </span>
                )}
              </span>
              {hasSubcategories && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(category.id);
                  }}
                  className="ms-2 p-1 rounded-full hover:bg-slate-600/50 focus:outline-none cursor-pointer transition-colors"
                >
                  <ChevronRight
                    size={16}
                    className={`transform transition-transform duration-200 text-white ${
                      isExpanded ? "rotate-90" : "rotate-0"
                    }`}
                  />
                </button>
              )}
            </div>
            {category.subcategories && expandedCategories[category.id] && (
              <PresentationCategoryTree
                categories={category.subcategories}
                onSelectCategory={onSelectCategory}
                level={level + 1}
                expandedCategories={expandedCategories}
                toggleCategory={toggleCategory}
                selectedCategoryId={selectedCategoryId}
                setSelectedCategoryIdDirectly={setSelectedCategoryIdDirectly}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default PresentationCategoryTree;
