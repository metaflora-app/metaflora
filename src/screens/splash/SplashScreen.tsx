import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { preloadAllImages } from '../../utils/assetPreloader';
import { getOrCreateUser } from '../../utils/supabase';
import { ThreeBg } from '../../components/ScreenLayout';
import logo from '../../assets/figma-welcome/splash-logo.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  useEffect(() => {
    const init = async () => {
      const [user] = await Promise.all([
        getOrCreateUser(),
        preloadAllImages(),
        new Promise(resolve => setTimeout(resolve, 3000)),
      ]);

      if (user && user.subscription_type === 'premium') {
        navigate('/main-dashboard-premium');
      } else {
        navigate('/welcome');
      }
    };

    init();
  }, [navigate]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', height: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <div
          className="motion-logo-preloader"
          style={{
            position: 'absolute',
            left: '371px',
            top: '772px',
            width: '438px',
            height: '309px',
          }}
        >
          <img
            src={logo}
            alt="МЕТАФЛОРА*"
            style={{
              position: 'absolute',
              inset: 0,
              width: '438px',
              height: '309px',
              objectFit: 'contain',
            }}
          />
        </div>
      </div>
    </div>
  );
};
