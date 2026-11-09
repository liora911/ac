/**
 * Article reading mode lives at /articles/<slug-or-id>/read and shows only the
 * article: the site chrome (navbar, breadcrumbs, footer, welcome modal) hides
 * itself on these paths.
 */
export function isReaderPath(pathname: string | null | undefined): boolean {
  return !!pathname && /^\/articles\/[^/]+\/read\/?$/.test(pathname);
}
