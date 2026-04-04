// Asset preloader - keep startup light and only warm assets opportunistically.
const allImageLoaders = Object.values(
  import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp,gif}', {
    import: 'default',
  })
) as Array<() => Promise<string>>;

let preloadPromise: Promise<void> | null = null;
let isPreloaded = false;
let criticalFontsPromise: Promise<void> | null = null;

export const preloadImageSource = (src: string): Promise<void> => (
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  })
);

export const preloadImageSources = async (sources: string[]): Promise<void> => {
  await Promise.all(sources.map((src) => preloadImageSource(src)));
};

export const preloadCriticalFonts = async (): Promise<void> => {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return;
  }

  if (criticalFontsPromise) {
    return criticalFontsPromise;
  }

  criticalFontsPromise = Promise.race([
    Promise.all([
      document.fonts.load('400 1em "Cygre"'),
      document.fonts.load('500 1em "Cygre"'),
      document.fonts.load('700 1em "Cygre"'),
      document.fonts.load('500 1em "Gotham Pro"'),
    ]).then(() => undefined),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, 1600);
    }),
  ]);

  await criticalFontsPromise;
};

export const preloadAllImages = (): Promise<void> => {
  if (isPreloaded) {
    return Promise.resolve();
  }

  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = new Promise((resolve) => {
    let loadedCount = 0;
    const totalImages = Math.min(allImageLoaders.length, 48);

    if (totalImages === 0) {
      isPreloaded = true;
      resolve();
      return;
    }

    allImageLoaders.slice(0, totalImages).forEach((loadImage) => {
      loadImage()
        .then((src) => preloadImageSource(src))
        .catch(() => undefined)
        .finally(() => {
          loadedCount++;
          if (loadedCount === totalImages) {
            isPreloaded = true;
            resolve();
          }
        });
    });
  });

  return preloadPromise;
};

export const isAllImagesPreloaded = () => isPreloaded;
