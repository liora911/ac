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
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate a color from hash
function hashToColor(hash: number, saturation = 70, lightness = 55): string {
  const hue = hash % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * LecturePlaceholder - A generative visual placeholder for lectures without banner images.
 * Creates a unique "audio waveform" inspired design based on the lecture ID.
 * The design evokes sound waves, representing spoken content.
 */
export default function LecturePlaceholder({ id, className = "" }: LecturePlaceholderProps) {
  const design = useMemo(() => {
    const hash1 = hashString(id);
    const hash2 = hashString(id + "secondary");
    const hash3 = hashString(id + "tertiary");

    // Primary and secondary colors
    const primaryColor = hashToColor(hash1, 75, 50);
    const secondaryColor = hashToColor(hash2, 65, 60);
    const accentColor = hashToColor(hash3, 80, 45);

    // Generate waveform bars (16-24 bars)
    const barCount = 16 + (hash1 % 9);
    const bars: { height: number; delay: number }[] = [];

    for (let i = 0; i < barCount; i++) {
      const barHash = hashString(id + i.toString());
      // Heights vary between 20% and 90%
      const height = 20 + (barHash % 70);
      // Staggered animation delay
      const delay = (i * 0.05) % 1;
      bars.push({ height, delay });
    }

    // Background gradient angle
    const gradientAngle = hash1 % 180;

    // Floating orbs (subtle background elements)
    const orbCount = 3 + (hash2 % 3);
    const orbs: { x: number; y: number; size: number; opacity: number }[] = [];

    for (let i = 0; i < orbCount; i++) {
      const orbHash = hashString(id + "orb" + i);
      orbs.push({
        x: 10 + (orbHash % 80),
        y: 10 + ((orbHash >> 8) % 80),
        size: 30 + (orbHash % 60),
        opacity: 0.1 + ((orbHash % 20) / 100),
      });
    }

    return {
      primaryColor,
      secondaryColor,
      accentColor,
      gradientAngle,
      bars,
      orbs,
    };
  }, [id]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(${design.gradientAngle}deg, ${design.primaryColor}20, ${design.secondaryColor}30)`,
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${design.accentColor}15 0%, transparent 50%)`,
        }}
      />

      {/* Floating orbs - subtle background depth */}
      {design.orbs.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-xl"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            background: i % 2 === 0 ? design.primaryColor : design.secondaryColor,
            opacity: orb.opacity,
          }}
        />
      ))}

      {/* Audio waveform visualization - centered */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="flex items-center gap-[2px] h-[60%]">
          {design.bars.map((bar, i) => (
            <div
              key={i}
              className="waveform-bar rounded-full"
              style={{
                width: "3px",
                height: `${bar.height}%`,
                background: `linear-gradient(to top, ${design.primaryColor}, ${design.accentColor})`,
                opacity: 0.7 + (bar.height / 300),
                animationDelay: `${bar.delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Center play icon suggestion - subtle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: `${design.primaryColor}30`,
            backdropFilter: "blur(4px)",
          }}
        >
          <svg
            className="w-5 h-5 ml-0.5"
            fill={design.accentColor}
            viewBox="0 0 24 24"
            style={{ opacity: 0.6 }}
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Animated pulse rings - very subtle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="pulse-ring absolute w-20 h-20 rounded-full"
          style={{
            border: `1px solid ${design.accentColor}`,
            opacity: 0.2,
          }}
        />
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        .waveform-bar {
          animation: waveform 1.5s ease-in-out infinite alternate;
        }

        @keyframes waveform {
          0% {
            transform: scaleY(0.6);
          }
          100% {
            transform: scaleY(1);
          }
        }

        .pulse-ring {
          animation: pulse 3s ease-out infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
