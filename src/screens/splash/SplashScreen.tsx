import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Background pattern image (dots)
import bgPattern from '../../assets/figma-welcome/pattern.png';
// Logo image
import logo from '../../assets/figma-welcome/splash-logo.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Preload only CRITICAL images in background (non-blocking)
    const criticalImages = [
      bgPattern,
      logo,
      '/src/assets/figma-welcome/logo-small.png',
      '/src/assets/tour-video/support-button.png',
      '/src/assets/welcome-elements/socials-icons.png',
    ];

    // Start preloading in background (don't wait)
    criticalImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    // Navigate after 3 seconds (reduced from 8)
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        background: '#020101',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background pattern - full screen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Logo - centered */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
        }}
      >
        <img
          src={logo}
          alt="МЕТАФЛОРА*"
          style={{
            width: 'min(80vw, 592px)',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};
