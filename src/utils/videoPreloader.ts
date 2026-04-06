const activeVideoPrewarmers = new Map<string, { video: HTMLVideoElement; stop: () => void }>();
const warmedVideoSources = new Set<string>();
const warmedPosterUrls = new Set<string>();
const MAX_ACTIVE_PREWARMS = 4;
const PREWARM_STOP_DELAY_MS = 4500;

function stopVideoPrewarm(src: string) {
  const activePrewarmer = activeVideoPrewarmers.get(src);
  if (!activePrewarmer) {
    return;
  }

  const { video } = activePrewarmer;
  video.pause();
  video.removeAttribute('src');
  video.load();
  activeVideoPrewarmers.delete(src);
  warmedVideoSources.add(src);
}

export function prewarmVideoSource(src?: string | null, posterSrc?: string | null) {
  if (typeof document === 'undefined') {
    return;
  }

  const normalizedSrc = String(src || '').trim();
  if (normalizedSrc && !warmedVideoSources.has(normalizedSrc) && !activeVideoPrewarmers.has(normalizedSrc)) {
    const video = document.createElement('video');
    let timeoutId: number | null = null;

    const stop = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      stopVideoPrewarm(normalizedSrc);
    };

    video.preload = 'auto';
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.src = normalizedSrc;
    video.load();
    video.addEventListener('loadeddata', stop, { once: true });
    video.addEventListener('canplay', stop, { once: true });
    timeoutId = window.setTimeout(stop, PREWARM_STOP_DELAY_MS);
    activeVideoPrewarmers.set(normalizedSrc, { video, stop });

    if (activeVideoPrewarmers.size > MAX_ACTIVE_PREWARMS) {
      const oldestKey = activeVideoPrewarmers.keys().next().value;
      if (oldestKey) {
        activeVideoPrewarmers.get(oldestKey)?.stop();
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
