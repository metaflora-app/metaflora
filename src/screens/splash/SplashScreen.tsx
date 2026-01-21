import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Background pattern image (dots)
import bgPattern from '../../assets/figma-welcome/pattern.png';
// Logo image
import logo from '../../assets/figma-welcome/splash-logo.png';

// Import first 2-3 screens assets to preload during splash
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import supportButton from '../../assets/tour-video/support-button.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import carouselLeft from '../../assets/figma-welcome/carousel-left.png';
import carouselCenter from '../../assets/figma-welcome/carousel-center.png';
import carouselRight from '../../assets/figma-welcome/carousel-right.png';
import tourButton1 from '../../assets/welcome/кнопка экскурсия по платформе.png';
import tourButton2 from '../../assets/welcome/кнопка попробовать бесплатно.png';
import policyPNG from '../../assets/welcome/политика конфиденциальности.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Preload first 2-3 screens assets in background (non-blocking)
    const firstScreensAssets = [
      logoSmall,
      logoFooter,
      supportButton,
      socialsIcons,
      carouselLeft,
      carouselCenter,
      carouselRight,
      tourButton1,
      tourButton2,
      policyPNG,
    ];

    // Start preloading in background (don't block splash display)
    firstScreensAssets.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    // Show splash for 12 seconds
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
