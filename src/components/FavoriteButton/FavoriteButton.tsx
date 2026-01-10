"use client";

import React from "react";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFavorite, FavoriteType } from "@/hooks/useFavorites";
import { useTranslation } from "@/contexts/Translation/translation.context";

interface FavoriteButtonProps {
  itemId: string;
  itemType: FavoriteType;
  size?: "sm" | "md" | "lg";
  className?: string;
  showTooltip?: boolean;
}

const sizeMap = {
  sm: { button: "w-7 h-7", icon: 14 },
  md: { button: "w-8 h-8", icon: 18 },
  lg: { button: "w-10 h-10", icon: 22 },
};

export default function FavoriteButton({
  itemId,
  itemType,
  size = "md",
  className = "",
  showTooltip = true,
}: FavoriteButtonProps) {
  const { t } = useTranslation();
  const { isFavorited, isLoading, toggle, isLoggedIn } = useFavorite(
    itemId,
    itemType
  );

  // Don't render if user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  const { button: buttonSize, icon: iconSize } = sizeMap[size];

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        ${buttonSize}
        flex items-center justify-center
        rounded-full
        transition-all duration-200
        ${
          isFavorited
            ? "bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50"
            : "bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
        }
        shadow-sm hover:shadow-md
        border border-gray-200/50 dark:border-gray-700/50
        cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        group
        ${className}
      `}
      whileTap={{ scale: 0.9 }}
      title={
        showTooltip
          ? isFavorited
            ? t("favorites.removeFromFavorites")
            : t("favorites.addToFavorites")
          : undefined
      }
      aria-label={
        isFavorited
          ? t("favorites.removeFromFavorites")
          : t("favorites.addToFavorites")
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFavorited ? "filled" : "empty"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Heart
            size={iconSize}
            className={`
              transition-colors duration-200
              ${
                isFavorited
                  ? "fill-red-500 text-red-500"
                  : "fill-transparent text-gray-400 group-hover:text-red-400"
              }
            `}
          />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
