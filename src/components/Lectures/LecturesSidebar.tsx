"use client";

import React from "react";
import { Category } from "@/types/Lectures/lectures";
import CategoryTree from "./CategoryTree";

interface LecturesSidebarProps {
  lectureData: Category[];
  onSelectCategory: (category: Category) => void;
  expandedCategories: Record<string, boolean>;
  toggleCategory: (categoryId: string) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryIdDirectly: (categoryId: string | null) => void;
}

const LecturesSidebar: React.FC<LecturesSidebarProps> = ({
  lectureData,
  onSelectCategory,
  expandedCategories,
  toggleCategory,
  selectedCategoryId,
  setSelectedCategoryIdDirectly,
}) => {
  return (
    <aside className="relative w-full md:w-1/4 lg:w-1/5  backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-slate-700/50">
      <h3 className="text-xl font-semibold mb-4 text-gray-300 border-b border-slate-600 pb-2">
        קטגוריות
      </h3>
      <CategoryTree
        categories={lectureData}
        onSelectCategory={onSelectCategory}
        expandedCategories={expandedCategories}
        toggleCategory={toggleCategory}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryIdDirectly={setSelectedCategoryIdDirectly}
      />
    </aside>
  );
};

export default LecturesSidebar;
