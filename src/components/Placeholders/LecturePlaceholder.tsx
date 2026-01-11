"use client";

import React, { useMemo } from "react";

interface LecturePlaceholderProps {
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
 * LecturePlaceholder - Clean, minimal generative placeholder for lectures.
 * Creates smooth gradient waves inspired by sound/audio visualization.
 */
export default function LecturePlaceholder({ id, className = "" }: LecturePlaceholderProps) {
  const design = useMemo(() => {
    const hash1 = hashString(id);
    const hash2 = hashString(id + "s");

    // Generate two hues that work well together (analogous colors)
    const baseHue = hash1 % 360;
    const secondHue = (baseHue + 30 + (hash2 % 40)) % 360;

    // Wave parameters - subtle variations
    const waveOffset = hash1 % 100;
    const waveFrequency = 0.8 + ((hash2 % 40) / 100);

    return {
      baseHue,
      secondHue,
      waveOffset,
      waveFrequency,
    };
  }, [id]);

  const { baseHue, secondHue, waveOffset, waveFrequency } = design;

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg,
            hsl(${baseHue}, 65%, 45%) 0%,
            hsl(${secondHue}, 55%, 55%) 50%,
            hsl(${baseHue}, 60%, 40%) 100%)`,
        }}
      />

      {/* SVG wave layers */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
      >
        {/* Bottom wave - darker */}
        <path
          d={`M0,180
              Q${100 + waveOffset * 0.5},${140 + Math.sin(waveFrequency) * 20}
              ${200},${160}
              T400,${150 + (waveOffset % 30)}
              L400,200 L0,200 Z`}
          fill={`hsla(${baseHue}, 50%, 25%, 0.4)`}
        />

        {/* Middle wave */}
        <path
          d={`M0,${160 - waveOffset * 0.2}
              Q${80 + waveOffset * 0.3},${120 + Math.cos(waveFrequency) * 15}
              ${200},${140}
              T400,${130 + (waveOffset % 20)}
              L400,200 L0,200 Z`}
          fill={`hsla(${secondHue}, 45%, 35%, 0.3)`}
        />

        {/* Top wave - lightest */}
        <path
          d={`M0,${140 - waveOffset * 0.15}
              Q${120 + waveOffset * 0.4},${100 + Math.sin(waveFrequency * 1.5) * 10}
              ${200},${120}
              T400,${110 + (waveOffset % 15)}
              L400,200 L0,200 Z`}
          fill={`hsla(${baseHue}, 40%, 45%, 0.25)`}
        />
      </svg>

      {/* Subtle play icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(4px)",
          }}
        >
          <svg
            className="w-5 h-5 ml-0.5"
            fill="rgba(255,255,255,0.8)"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
