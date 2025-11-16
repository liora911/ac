"use client";

import React from "react";
import { PresentationCategory } from "@/types/Presentations/presentations";

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
      {categories.map((category) => (
        <li key={category.id}>
          <div
            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-300
  ${
    selectedCategoryId === category.id
      ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30"
      : "bg-slate-800/50 text-white hover:bg-gradient-to-br hover:from-blue-500/30 hover:to-purple-600/30 hover:shadow-md hover:shadow-blue-500/10"
  }`}
          >
            <span
              className="flex-grow font-medium cursor-pointer"
              onClick={() => {
                onSelectCategory(category);
                setSelectedCategoryIdDirectly(category.id);
              }}
            >
              {category.name} ({category.presentations.length})
            </span>
            {category.subcategories && category.subcategories.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(category.id);
                }}
                className="ml-2 p-1 rounded-full hover:bg-slate-600/50 focus:outline-none cursor-pointer transition-colors"
              >
                <span
                  className={`transform transition-transform text-white ${
                    expandedCategories[category.id] ? "rotate-90" : "rotate-0"
                  }`}
                >
                  ▶
                </span>
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
      ))}
    </ul>
  );
};

export default PresentationCategoryTree;
