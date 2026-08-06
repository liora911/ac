// Shared color helpers for widgets that accept a custom hex color.

/** True for a valid #RRGGBB hex string. */
export function isHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

/** Pick black or white text for readable contrast on the given background hex. */
export function readableTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111827" : "#ffffff";
}

/** Append an alpha channel (e.g. "1a" ≈ 10%) to a #RRGGBB hex. */
export function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}
