import React, { useEffect, useState } from 'react';
import splashLogo from '../assets/figma-welcome/splash-logo.png';
import bgPattern from '../assets/figma-welcome/pattern.png';

export const GlobalLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show splash screen for 8 seconds to allow all assets to load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 8000);

    return () => clearTimeout(timer);
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
