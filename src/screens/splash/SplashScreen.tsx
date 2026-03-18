import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { preloadAllImages } from '../../utils/assetPreloader';
import { getOrCreateUser } from '../../utils/supabase';
import { ThreeBg } from '../../components/ScreenLayout';
import logo from '../../assets/figma-welcome/splash-logo.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

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
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#020101', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ThreeBg />
      <div style={{ position: 'relative', zIndex: 10 }}>
        <img src={logo} alt="МЕТАФЛОРА*" style={{ width: 'min(80vw, 438px)', height: 'auto', objectFit: 'contain' }} />
      </div>
    </div>
  );
};
