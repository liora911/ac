"use client";

import React from "react";
import { Category, CategoryTreeProps } from "@/types/Lectures/lectures";

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onSelectCategory,
  level = 0,
  expandedCategories,
  toggleCategory,
  selectedCategoryId,
  setSelectedCategoryIdDirectly,
}) => {
  return (
    <ul className={`ml-${level * 4} space-y-2`}>
      {categories.map((category) => (
        <li key={category.id}>
          <div
            className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 ${
              selectedCategoryId === category.id
                ? "bg-cyan-600/20 text-cyan-200 border border-cyan-500/30"
                : "bg-slate-800/50 text-slate-300 hover:text-cyan-300"
            }`}
          >
            <span
              className="flex-grow font-medium cursor-pointer"
              onClick={() => {
                onSelectCategory(category);
                setSelectedCategoryIdDirectly(category.id);
              }}
            >
              {category.name} ({category.lectures.length})
            </span>
            {category.subcategories && category.subcategories.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent category selection when clicking the toggle
                  toggleCategory(category.id);
                }}
                className="ml-2 p-1 rounded-full hover:bg-slate-600/50 focus:outline-none cursor-pointer transition-colors"
              >
                <span
                  className={`transform transition-transform text-cyan-400 ${
                    expandedCategories[category.id] ? "rotate-90" : "rotate-0"
                  }`}
                >
                  ▶
                </span>
              </button>
            )}
          </div>
          {category.subcategories && expandedCategories[category.id] && (
            <CategoryTree
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

export default CategoryTree;
