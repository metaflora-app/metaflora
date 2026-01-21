import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { preloadAllAssets } from '../../utils/preloadAllAssets';

// Background pattern image (dots)
import bgPattern from '../../assets/figma-welcome/pattern.png';
// Logo image
import logo from '../../assets/figma-welcome/splash-logo.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [canNavigate, setCanNavigate] = useState(false);

  useEffect(() => {
    let assetsLoaded = false;
    let timeoutPassed = false;

    // Preload ALL assets
    preloadAllAssets().then(() => {
      assetsLoaded = true;
      if (timeoutPassed) {
        setCanNavigate(true);
      }
    });

    // Wait minimum 8 seconds
    const timer = setTimeout(() => {
      timeoutPassed = true;
      if (assetsLoaded) {
        setCanNavigate(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (canNavigate) {
      navigate('/welcome');
    }
  }, [canNavigate, navigate]);

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
