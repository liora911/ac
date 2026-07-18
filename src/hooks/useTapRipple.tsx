"use client";

import React, { useState, useCallback } from "react";

type Ripple = { id: number; x: number; y: number; size: number };

/**
 * PS5-style tap feedback: a blue radial glow that fades in from the click
 * point and out. Returns a pointer handler plus the ripple layer to drop
 * inside a `relative overflow-hidden` element.
 */
export function useTapRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const id = e.timeStamp;
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top, size },
    ]);
    // Drop the ripple after its animation completes
    window.setTimeout(
      () => setRipples((prev) => prev.filter((r) => r.id !== id)),
      600
    );
  }, []);

  const rippleLayer = (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {ripples.map((r) => (
        <span
          key={r.id}
          className="tap-ripple absolute rounded-full bg-blue-500/30 dark:bg-blue-400/30"
          style={{
            left: r.x - r.size / 2,
            top: r.y - r.size / 2,
            width: r.size,
            height: r.size,
          }}
        />
      ))}
    </span>
  );

  return { onPointerDown, rippleLayer };
}
