import { useEffect } from 'react';

// Preload next screen assets while user is on current screen
export const usePreloadNextScreen = (nextScreenAssets: string[]) => {
  useEffect(() => {
    // Start preloading in background
    nextScreenAssets.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [nextScreenAssets]);
};
