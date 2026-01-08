import React from 'react';
import logo from '../../assets/logo.png';

/**
 * SplashScreen Component
 * 
 * First screen of the Telegram Mini App
 * - Fullscreen mobile layout with black background
 * - Subtle dotted grid pattern (CSS-based)
 * - Centered white logo
 * - No interactions or animations
 */
export const SplashScreen: React.FC = () => {
  return (
    <div 
      className="relative flex items-center justify-center w-screen h-screen bg-black overflow-hidden"
      style={{
        // CSS-based dotted grid pattern
        // Creates subtle gray dots on black background
        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0',
      }}
    >
      {/* Logo container - centered both horizontally and vertically */}
      <div className="flex items-center justify-center px-8">
        <img 
          src={logo} 
          alt="Метафлора"
          className="max-w-[280px] w-full h-auto"
        />
      </div>
    </div>
  );
};

