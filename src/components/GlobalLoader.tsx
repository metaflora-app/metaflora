import React, { useEffect, useState } from 'react';
import splashLogo from '../assets/splash/logo-splash.png';
import bgPattern from '../assets/figma-welcome/pattern.png';

// Import all critical images from all screens
const CRITICAL_IMAGES = [
  // Common assets
  '/src/assets/figma-welcome/pattern.png',
  '/src/assets/figma-welcome/logo-small.png',
  '/src/assets/figma-welcome/logo-footer.png',
  '/src/assets/tour-video/support-button.png',
  '/src/assets/welcome-elements/socials-icons.png',
  
  // Splash
  '/src/assets/splash/logo-splash.png',
  
  // Welcome
  '/src/assets/welcome/carousel-1.png',
  '/src/assets/welcome/carousel-2.png',
  '/src/assets/welcome/carousel-3.png',
  
  // Main screens backgrounds
  '/src/assets/main-dashboard/фон лаба.png',
  
  // Add more critical images as needed
];

export const GlobalLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let loadedCount = 0;
    const totalImages = CRITICAL_IMAGES.length;

    const imagePromises = CRITICAL_IMAGES.map((src) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          setProgress(Math.round((loadedCount / totalImages) * 100));
          resolve();
        };
        img.onerror = () => {
          loadedCount++;
          setProgress(Math.round((loadedCount / totalImages) * 100));
          resolve(); // Continue even if image fails
        };
        img.src = src;
      });
    });

    Promise.all(imagePromises).then(() => {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    });
  }, []);

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: '#020101',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgPattern})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
            opacity: 0.3,
          }}
        />

        {/* Logo */}
        <img 
          src={splashLogo}
          alt="МЕТАФЛОРА*"
          style={{
            width: '300px',
            height: 'auto',
            marginBottom: '40px',
            position: 'relative',
            zIndex: 1,
          }}
        />

        {/* Progress bar */}
        <div style={{
          width: '300px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #FF6B6B, #4ECDC4)',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Progress text */}
        <div style={{
          marginTop: '20px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '14px',
          fontFamily: 'Gotham Pro, sans-serif',
          position: 'relative',
          zIndex: 1,
        }}>
          {progress}%
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
