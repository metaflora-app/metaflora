// Image optimization utilities

export const getImageProps = (priority: 'high' | 'low' = 'low') => {
  return {
    loading: priority === 'high' ? ('eager' as const) : ('lazy' as const),
    decoding: 'async' as const,
  };
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImages = async (sources: string[]): Promise<void> => {
  try {
    await Promise.all(sources.map(preloadImage));
  } catch (error) {
    console.error('Failed to preload images:', error);
  }
};
