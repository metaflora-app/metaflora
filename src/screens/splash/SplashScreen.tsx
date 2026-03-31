import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { preloadAllImages, preloadCriticalFonts } from '../../utils/assetPreloader';
import { getOrCreateUser } from '../../utils/supabase';
import { ThreeBg } from '../../components/ScreenLayout';
import logo from '../../assets/figma-welcome/splash-logo.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  useEffect(() => {
    let isActive = true;

    const init = async () => {
      void preloadCriticalFonts();
      void preloadAllImages();
      const userPromise = getOrCreateUser().catch(() => null);
      const [user] = await Promise.all([
        userPromise,
        new Promise((resolve) => window.setTimeout(resolve, 12000)),
      ]);

      if (!isActive) {
        return;
      }

      if (user?.subscription_type === 'premium') {
        navigate('/main-dashboard-premium');
      } else {
        navigate('/welcome');
      }
    };

    void init();

    return () => {
      isActive = false;
    };
  }, [navigate]);

  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', height: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <img
          src={logo}
          alt="МЕТАФЛОРА*"
          fetchPriority="high"
          className="soft-logo-reveal"
          style={{
            position: 'absolute',
            left: '371px',
            top: '772px',
            width: '438px',
            height: '309px',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};
