"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Crown } from "lucide-react";
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
  const popoverWidth = 420;
  const popoverHeight = 400;
  const padding = 16;

  let left = position.x - popoverWidth / 2;
  let top = position.y - popoverHeight - 20;

  // Adjust horizontal position
  if (typeof window !== "undefined") {
    if (left < padding) left = padding;
    if (left + popoverWidth > window.innerWidth - padding) {
      left = window.innerWidth - popoverWidth - padding;
    }

    // If not enough space above, show below
    if (top < padding) {
      top = position.y + 20;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden border border-gray-200 dark:border-gray-700/80"
      style={{ left, top, width: popoverWidth }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Image section — larger */}
      <div className="relative h-52 bg-gray-200 dark:bg-gray-800">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="420px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800" />
        )}

        {/* Bottom gradient fade into content */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white dark:from-gray-900 to-transparent" />

        {/* Badges overlaid on image */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {item.isFeatured && (
            <div className="flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg">
              <Star className="w-3.5 h-3.5 text-white fill-white" />
              <span className="text-white text-xs font-semibold">Featured</span>
            </div>
          )}
          {item.isPremium && (
            <div className="flex items-center gap-1 bg-purple-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg">
              <Crown className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-semibold">Premium</span>
            </div>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className="px-5 pb-5 -mt-4 relative">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 mb-2 leading-snug">
          {item.title}
        </h3>

        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ContentPreviewPopover;
