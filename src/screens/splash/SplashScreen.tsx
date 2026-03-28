import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { preloadAllImages, preloadImageSources } from '../../utils/assetPreloader';
import { getOrCreateUser } from '../../utils/supabase';
import { ThreeBg } from '../../components/ScreenLayout';
import bgBase from '../../assets/figma-welcome/фон для эксперимента.png';
import logo from '../../assets/figma-welcome/splash-logo.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [assetsReady, setAssetsReady] = React.useState(false);

  useEffect(() => {
    let isActive = true;

    const init = async () => {
      const criticalAssetsPromise = preloadImageSources([bgBase, logo]).then(() => {
        if (isActive) {
          setAssetsReady(true);
        }
      });

      window.setTimeout(() => {
        void preloadAllImages();
      }, 250);

      const [user] = await Promise.all([
        getOrCreateUser(),
        criticalAssetsPromise,
        new Promise(resolve => setTimeout(resolve, 1200)),
      ]);

      if (!isActive) {
        return;
      }

      if (user && user.subscription_type === 'premium') {
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
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', height: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {assetsReady ? (
          <>
            <ThreeBg />
            <img
              src={logo}
              alt="МЕТАФЛОРА*"
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
          </>
        ) : null}
      </div>
    </div>
  );
};
