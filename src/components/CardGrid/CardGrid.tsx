import React from "react";

/**
 * Card grid that degrades gracefully when under-filled.
 *
 * A normal CSS grid left-aligns a lone item, leaving a wall of dead space that
 * reads as "broken" rather than "few items". This uses a centered flex-wrap
 * instead, so 1–2 items sit centered and a full set still tiles into neat rows.
 *
 * Children should carry a fixed basis width (e.g. `w-full sm:w-80`) so the rows
 * wrap predictably.
 */
export default function CardGrid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap justify-center gap-6 ${className}`}>
      {children}
    </div>
  );
}
