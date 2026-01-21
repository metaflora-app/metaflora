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
