/**
 * Extract YouTube/Vimeo video ID and return embed URL
 */
export function getVideoEmbedUrl(url: string): { embedUrl: string; type: 'youtube' | 'vimeo' | 'unknown' } {
  // YouTube patterns
  const ytPatterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of ytPatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        embedUrl: `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&rel=0`,
        type: 'youtube',
      };
    }
  }

  // Vimeo patterns
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        embedUrl: `https://player.vimeo.com/video/${match[1]}?api=1`,
        type: 'vimeo',
      };
    }
  }

  return { embedUrl: url, type: 'unknown' };
}

export function detectVideoType(url: string): 'youtube' | 'vimeo' {
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo')) return 'vimeo';
  return 'youtube';
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatProgress(watched: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((watched / total) * 100));
}
