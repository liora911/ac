"use client";

import React, { useMemo } from "react";

interface PresentationPlaceholderProps {
  id: string;
  className?: string;
}

// Simple hash function to generate consistent numbers from a string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * PresentationPlaceholder - Clean, minimal generative placeholder for presentations.
 * Creates a smooth mesh gradient effect - modern and elegant.
 */
export default function PresentationPlaceholder({ id, className = "" }: PresentationPlaceholderProps) {
  const design = useMemo(() => {
    const hash1 = hashString(id);
    const hash2 = hashString(id + "p");
    const hash3 = hashString(id + "r");

    // Generate complementary hues for a rich gradient
    const baseHue = hash1 % 360;
    const secondHue = (baseHue + 40 + (hash2 % 50)) % 360;
    const thirdHue = (baseHue + 180 + (hash3 % 60) - 30) % 360;

    // Positions for gradient blobs
    const blob1X = 20 + (hash1 % 30);
    const blob1Y = 20 + (hash2 % 30);
    const blob2X = 60 + (hash2 % 30);
    const blob2Y = 60 + (hash3 % 30);

    return {
      baseHue,
      secondHue,
      thirdHue,
      blob1X,
      blob1Y,
      blob2X,
      blob2Y,
    };
  }, [id]);

  const { baseHue, secondHue, thirdHue, blob1X, blob1Y, blob2X, blob2Y } = design;

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Base solid color */}
      <div
        className="absolute inset-0"
        style={{
          background: `hsl(${baseHue}, 50%, 50%)`,
        }}
      />

      {/* Mesh gradient blobs */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: "80%",
          height: "80%",
          left: `${blob1X}%`,
          top: `${blob1Y}%`,
          transform: "translate(-50%, -50%)",
          background: `hsl(${secondHue}, 60%, 55%)`,
          opacity: 0.7,
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: "70%",
          height: "70%",
          left: `${blob2X}%`,
          top: `${blob2Y}%`,
          transform: "translate(-50%, -50%)",
          background: `hsl(${thirdHue}, 55%, 60%)`,
          opacity: 0.5,
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle presentation icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(4px)",
          }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="3" width="18" height="13" rx="2" />
            <path d="M8 20l4-4 4 4" />
            <path d="M12 16v-3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
