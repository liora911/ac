"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { TooltipProps } from "@/types/Components/components";

export default function Tooltip({
  children,
  content,
  position = "top",
  delay = 200,
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = triggerRect.top + scrollY - tooltipRect.height - 8;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + scrollY + 8;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case "left":
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - 8;
        break;
      case "right":
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scrollX + 8;
        break;
    }

    // Keep tooltip within viewport
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (top < scrollY + padding) top = scrollY + padding;
    if (top + tooltipRect.height > scrollY + viewportHeight - padding) {
      top = scrollY + viewportHeight - tooltipRect.height - padding;
    }

    setCoords({ top, left });
  };

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      requestAnimationFrame(updatePosition);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible]);

  const tooltipContent = isVisible && mounted && (
    createPortal(
      <div
        ref={tooltipRef}
        role="tooltip"
        style={{
          position: "absolute",
          top: coords.top,
          left: coords.left,
          zIndex: 9999,
        }}
        className={`
          animate-in fade-in-0 zoom-in-95 duration-150
          px-3 py-2 text-sm rounded-lg shadow-lg
          bg-gray-900 text-white dark:bg-gray-800 dark:text-gray-100
          max-w-xs
          ${className}
        `}
      >
        {content}
        {/* Arrow */}
        <div
          className={`
            absolute w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45
            ${position === "top" ? "bottom-[-4px] left-1/2 -translate-x-1/2" : ""}
            ${position === "bottom" ? "top-[-4px] left-1/2 -translate-x-1/2" : ""}
            ${position === "left" ? "right-[-4px] top-1/2 -translate-y-1/2" : ""}
            ${position === "right" ? "left-[-4px] top-1/2 -translate-y-1/2" : ""}
          `}
        />
      </div>,
      document.body
    )
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="inline-flex"
      >
        {children}
      </div>
      {tooltipContent}
    </>
  );
}
