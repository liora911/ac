"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalCarouselProps {
  children: React.ReactNode;
  /** Title displayed above the carousel */
  title?: string;
  /** Optional subtitle or count */
  subtitle?: string;
  /** Show navigation arrows */
  showArrows?: boolean;
  /** Gap between items in pixels */
  gap?: number;
  /** Additional class for the container */
  className?: string;
  /** Additional class for the title */
  titleClassName?: string;
  /** Link to view all items */
  viewAllHref?: string;
  /** View all text */
  viewAllText?: string;
}

/**
 * Reusable horizontal carousel component with scroll arrows.
 * Works on both desktop (arrows + drag) and mobile (touch scroll).
 *
 * @example
 * <HorizontalCarousel title="Category Name" subtitle="12 items">
 *   {items.map(item => <ItemCard key={item.id} item={item} />)}
 * </HorizontalCarousel>
 */
export default function HorizontalCarousel({
  children,
  title,
  subtitle,
  showArrows = true,
  gap = 16,
  className = "",
  titleClassName = "",
  viewAllHref,
  viewAllText,
}: HorizontalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);

  const checkScrollability = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScrollability();
    window.addEventListener("resize", checkScrollability);
    return () => window.removeEventListener("resize", checkScrollability);
  }, [checkScrollability]);

  useEffect(() => {
    // Recheck after children render
    const timeout = setTimeout(checkScrollability, 100);
    return () => clearTimeout(timeout);
  }, [children, checkScrollability]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeftStart(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftStart - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      {(title || viewAllHref) && (
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-3">
            {title && (
              <h2
                className={`text-xl md:text-2xl font-bold text-gray-900 dark:text-white ${titleClassName}`}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {subtitle}
              </span>
            )}
          </div>
          {viewAllHref && viewAllText && (
            <a
              href={viewAllHref}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {viewAllText}
            </a>
          )}
        </div>
      )}

      {/* Carousel container */}
      <div className="relative group">
        {/* Left arrow */}
        {showArrows && canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute start-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 -translate-x-1/2 cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={checkScrollability}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className={`flex overflow-x-auto scrollbar-hide scroll-smooth ${
            isDragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
          style={{
            gap: `${gap}px`,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingBottom: "8px", // Space for shadows
          }}
        >
          {children}
        </div>

        {/* Right arrow */}
        {showArrows && canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute end-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 translate-x-1/2 cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        {/* Gradient fades */}
        {canScrollLeft && (
          <div className="absolute start-0 top-0 bottom-2 w-12 bg-gradient-to-e from-white dark:from-gray-950 to-transparent pointer-events-none z-[5]" />
        )}
        {canScrollRight && (
          <div className="absolute end-0 top-0 bottom-2 w-12 bg-gradient-to-s from-white dark:from-gray-950 to-transparent pointer-events-none z-[5]" />
        )}
      </div>
    </div>
  );
}
