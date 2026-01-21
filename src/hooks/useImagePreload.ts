import { useEffect, useState } from 'react';

export const useImagePreload = (imageSources: string[]) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const imagePromises = imageSources.map((src) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => reject();
      });
    });

    Promise.all(imagePromises)
      .then(() => {
        if (isMounted) {
          setImagesLoaded(true);
        }
      })
      .catch((error) => {
        console.error('Image preload failed:', error);
        if (isMounted) {
          setImagesLoaded(true); // Show screen even if some images fail
        }
      });

    return () => {
      isMounted = false;
    };
  }, [imageSources]);

  return imagesLoaded;
};
