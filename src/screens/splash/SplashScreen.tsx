import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { preloadAllImages } from '../../utils/assetPreloader';
import { getOrCreateUser } from '../../utils/supabase';

// Background pattern image (dots)
import bgPattern from '../../assets/figma-welcome/pattern.png';
// Logo image
import logo from '../../assets/figma-welcome/splash-logo.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Start preloading ALL images immediately
    preloadAllImages().then(() => {
      setImagesLoaded(true);
    });

    // Initialize or get user from Supabase
    getOrCreateUser().catch(err => {
      console.error('Failed to initialize user:', err);
    });

    // Minimum 8 seconds display
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  // Navigate only when BOTH conditions met: images loaded AND 12 seconds passed
  useEffect(() => {
    if (imagesLoaded && minTimeElapsed) {
      navigate('/welcome');
    }
  }, [imagesLoaded, minTimeElapsed, navigate]);

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
