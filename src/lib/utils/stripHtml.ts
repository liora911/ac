export function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * A short plain-text preview of rich HTML content, wrapped in a <p> so it still
 * renders. Used to gate premium article bodies server-side — the API returns
 * only this teaser to non-subscribers instead of the full paid content.
 */
export function contentTeaser(html: string, max = 500): string {
  const text = stripHtml(html);
  if (!text) return "";
  const clipped =
    text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
  return `<p>${clipped}</p>`;
}
