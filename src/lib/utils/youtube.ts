/**
 * Extract YouTube video ID from various URL formats
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, or just the ID
 */
export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Get YouTube thumbnail URL from video ID
 * Uses hqdefault (480x360) which is available for all videos
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Get YouTube thumbnail URL from video URL
 * Returns null if URL is invalid or not a YouTube URL
 */
export function getYouTubeThumbnailFromUrl(url?: string | null): string | null {
  const videoId = getYouTubeVideoId(url);
  return videoId ? getYouTubeThumbnail(videoId) : null;
}
