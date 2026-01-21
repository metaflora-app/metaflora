// Preload ALL assets before app starts

// Auto-generate list of all images
const imageModules = import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp}', { 
  eager: true,
  as: 'url'
});

export const getAllImageUrls = (): string[] => {
  return Object.values(imageModules);
};

export const preloadAllAssets = async (): Promise<void> => {
  const images = getAllImageUrls();
  
  const promises = images.map((src) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Continue even if fails
      img.src = src;
    });
  });

  await Promise.all(promises);
};
