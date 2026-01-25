"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import PremiumBadge from "@/components/PremiumBadge";
import type { ContentPreviewPopoverProps } from "@/types/Home/home";

const ContentPreviewPopover: React.FC<ContentPreviewPopoverProps> = ({
  item,
  imageUrl,
  subtitle,
  position,
  onMouseEnter,
  onMouseLeave,
}) => {

  // Calculate position to keep popover in viewport
  const popoverWidth = 320;
  const popoverHeight = 280;
  const padding = 16;

  let left = position.x - popoverWidth / 2;
  let top = position.y - popoverHeight - 20;

  // Adjust horizontal position
  if (left < padding) left = padding;
  if (left + popoverWidth > window.innerWidth - padding) {
    left = window.innerWidth - popoverWidth - padding;
  }

  // If not enough space above, show below
  if (top < padding) {
    top = position.y + 20;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
      style={{ left, top }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Image */}
      <div className="relative h-36 bg-gray-200 dark:bg-gray-700">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="320px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {item.isFeatured && (
            <div className="bg-amber-500 p-1 rounded-full shadow">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          )}
          {item.isPremium && <PremiumBadge size="sm" />}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1.5">
          {item.title}
        </h3>

        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ContentPreviewPopover;
