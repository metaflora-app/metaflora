import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

function App() {
  useEffect(() => {
    // Preload critical images on app mount
    const criticalImages = [
      '/src/assets/figma-welcome/pattern.png',
      '/src/assets/figma-welcome/logo-small.png',
      '/src/assets/tour-video/support-button.png',
    ];

    criticalImages.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
