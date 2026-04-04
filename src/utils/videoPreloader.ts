const warmedVideoElements = new Map<string, HTMLVideoElement>();
const warmedPosterUrls = new Set<string>();

export function prewarmVideoSource(src?: string | null, posterSrc?: string | null) {
  if (typeof document === 'undefined') {
    return;
  }

  const normalizedSrc = String(src || '').trim();
  if (normalizedSrc && !warmedVideoElements.has(normalizedSrc)) {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.src = normalizedSrc;
    video.load();
    warmedVideoElements.set(normalizedSrc, video);

    if (warmedVideoElements.size > 8) {
      const oldestKey = warmedVideoElements.keys().next().value;
      if (oldestKey) {
        const oldestVideo = warmedVideoElements.get(oldestKey);
        oldestVideo?.pause();
        oldestVideo?.removeAttribute('src');
        oldestVideo?.load();
        warmedVideoElements.delete(oldestKey);
      }
    }
  }

  const normalizedPoster = String(posterSrc || '').trim();
  if (normalizedPoster && !warmedPosterUrls.has(normalizedPoster)) {
    const image = new Image();
    image.decoding = 'async';
    image.src = normalizedPoster;
    warmedPosterUrls.add(normalizedPoster);
  }
}
