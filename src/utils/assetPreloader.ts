// Asset preloader - forces all images to load before navigation

// Generate list of ALL images at build time
const allImages = Object.values(
  import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp,gif}', {
    eager: true,
    import: 'default',
  })
) as string[];

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
    const totalImages = allImages.length;

    if (totalImages === 0) {
      isPreloaded = true;
      resolve();
      return;
    }

    allImages.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          isPreloaded = true;
          resolve();
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          isPreloaded = true;
          resolve();
        }
      };
      img.src = src;
    });
  });

  return preloadPromise;
};

export const isAllImagesPreloaded = () => isPreloaded;
