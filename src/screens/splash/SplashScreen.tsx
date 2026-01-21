import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Background pattern image (dots)
import bgPattern from '../../assets/figma-welcome/pattern.png';
// Logo image
import logo from '../../assets/figma-welcome/splash-logo.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Force preload ALL images during splash screen
    const imageModules = import.meta.glob('../../assets/**/*.{png,jpg,jpeg,webp}', { 
      eager: false,
      query: '?url',
      import: 'default',
    });

    // Start loading all images immediately
    Promise.all(
      Object.keys(imageModules).map(async (path) => {
        try {
          const module = await imageModules[path]();
          const img = new Image();
          img.src = module as string;
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        } catch (e) {
          return Promise.resolve();
        }
      })
    );

    // Navigate after 12 seconds
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 12000);

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
