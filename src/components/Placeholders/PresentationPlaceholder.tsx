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

// Generate a color from hash
function hashToColor(hash: number, saturation = 70, lightness = 55): string {
  const hue = hash % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * PresentationPlaceholder - A generative visual placeholder for presentations.
 * Creates a unique "slide deck" inspired design with floating geometric shapes
 * representing slides, charts, and data visualizations.
 */
export default function PresentationPlaceholder({ id, className = "" }: PresentationPlaceholderProps) {
  const design = useMemo(() => {
    const hash1 = hashString(id);
    const hash2 = hashString(id + "secondary");
    const hash3 = hashString(id + "tertiary");
    const hash4 = hashString(id + "quaternary");

    // Color palette
    const primaryColor = hashToColor(hash1, 75, 50);
    const secondaryColor = hashToColor(hash2, 65, 60);
    const accentColor = hashToColor(hash3, 80, 45);
    const backgroundColor = hashToColor(hash4, 30, 95);

    // Generate floating slide shapes (3-5 slides)
    const slideCount = 3 + (hash1 % 3);
    const slides: {
      x: number;
      y: number;
      rotation: number;
      scale: number;
      zIndex: number;
      variant: "chart" | "text" | "image" | "graph";
    }[] = [];

    const variants: ("chart" | "text" | "image" | "graph")[] = ["chart", "text", "image", "graph"];

    for (let i = 0; i < slideCount; i++) {
      const slideHash = hashString(id + "slide" + i);
      slides.push({
        x: 15 + ((slideHash % 50)),
        y: 15 + (((slideHash >> 4) % 40)),
        rotation: -15 + ((slideHash >> 8) % 30),
        scale: 0.6 + ((slideHash % 40) / 100),
        zIndex: slideCount - i,
        variant: variants[(slideHash >> 12) % 4],
      });
    }

    // Generate floating data points for "graph" effect
    const pointCount = 5 + (hash2 % 6);
    const dataPoints: { x: number; y: number; size: number }[] = [];

    for (let i = 0; i < pointCount; i++) {
      const pointHash = hashString(id + "point" + i);
      dataPoints.push({
        x: 10 + (pointHash % 80),
        y: 20 + ((pointHash >> 8) % 60),
        size: 4 + (pointHash % 8),
      });
    }

    // Connecting lines between points
    const lineCount = Math.min(pointCount - 1, 4);

    // Bar chart heights (for chart variant)
    const barCount = 4 + (hash3 % 3);
    const bars: number[] = [];
    for (let i = 0; i < barCount; i++) {
      bars.push(30 + (hashString(id + "bar" + i) % 60));
    }

    return {
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      slides,
      dataPoints,
      lineCount,
      bars,
    };
  }, [id]);

  // Render mini chart content based on variant
  const renderSlideContent = (variant: string, index: number) => {
    switch (variant) {
      case "chart":
        return (
          <div className="flex items-end justify-center gap-1 h-full p-2">
            {design.bars.slice(0, 4).map((height, i) => (
              <div
                key={i}
                className="w-2 rounded-t"
                style={{
                  height: `${height}%`,
                  background: i === index % 4 ? design.accentColor : design.secondaryColor,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        );
      case "text":
        return (
          <div className="flex flex-col gap-1 p-2">
            <div
              className="h-1.5 rounded"
              style={{ width: "80%", background: design.primaryColor, opacity: 0.6 }}
            />
            <div
              className="h-1 rounded"
              style={{ width: "100%", background: design.secondaryColor, opacity: 0.4 }}
            />
            <div
              className="h-1 rounded"
              style={{ width: "70%", background: design.secondaryColor, opacity: 0.4 }}
            />
          </div>
        );
      case "image":
        return (
          <div className="flex items-center justify-center h-full">
            <div
              className="w-8 h-6 rounded"
              style={{
                background: `linear-gradient(135deg, ${design.primaryColor}40, ${design.accentColor}40)`,
              }}
            />
          </div>
        );
      case "graph":
        return (
          <svg className="w-full h-full p-1" viewBox="0 0 40 30">
            <polyline
              points="5,25 12,15 20,20 28,8 35,12"
              fill="none"
              stroke={design.accentColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
            <circle cx="12" cy="15" r="2" fill={design.primaryColor} opacity="0.8" />
            <circle cx="28" cy="8" r="2" fill={design.primaryColor} opacity="0.8" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(145deg, ${design.backgroundColor}, ${design.primaryColor}15)`,
      }}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(${design.primaryColor} 1px, transparent 1px),
            linear-gradient(90deg, ${design.primaryColor} 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Floating data points */}
      {design.dataPoints.map((point, i) => (
        <div
          key={i}
          className="absolute rounded-full floating-point"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: `${point.size}px`,
            height: `${point.size}px`,
            background: i % 2 === 0 ? design.accentColor : design.primaryColor,
            opacity: 0.3,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}

      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {design.dataPoints.slice(0, design.lineCount).map((point, i) => {
          const nextPoint = design.dataPoints[i + 1];
          if (!nextPoint) return null;
          return (
            <line
              key={i}
              x1={`${point.x}%`}
              y1={`${point.y}%`}
              x2={`${nextPoint.x}%`}
              y2={`${nextPoint.y}%`}
              stroke={design.secondaryColor}
              strokeWidth="1"
              opacity="0.15"
              strokeDasharray="4 2"
            />
          );
        })}
      </svg>

      {/* Floating slide cards */}
      {design.slides.map((slide, i) => (
        <div
          key={i}
          className="absolute slide-card"
          style={{
            left: `${slide.x}%`,
            top: `${slide.y}%`,
            transform: `rotate(${slide.rotation}deg) scale(${slide.scale})`,
            zIndex: slide.zIndex,
            animationDelay: `${i * 0.2}s`,
          }}
        >
          <div
            className="w-16 h-12 rounded-lg shadow-lg overflow-hidden"
            style={{
              background: "white",
              border: `1px solid ${design.primaryColor}30`,
            }}
          >
            {renderSlideContent(slide.variant, i)}
          </div>
        </div>
      ))}

      {/* Center presentation icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${design.primaryColor}40, ${design.accentColor}40)`,
            backdropFilter: "blur(8px)",
            boxShadow: `0 4px 20px ${design.primaryColor}30`,
          }}
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke={design.accentColor}
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            style={{ opacity: 0.8 }}
          >
            {/* Presentation/screen icon */}
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21l4-4 4 4" />
            <path d="M12 17v-4" />
          </svg>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        .floating-point {
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .slide-card {
          animation: slideFloat 5s ease-in-out infinite;
        }

        @keyframes slideFloat {
          0%, 100% {
            transform: rotate(var(--rotation, 0deg)) scale(var(--scale, 1)) translateY(0);
          }
          50% {
            transform: rotate(var(--rotation, 0deg)) scale(var(--scale, 1)) translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}
