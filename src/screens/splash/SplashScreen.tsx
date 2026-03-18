import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { preloadAllImages } from '../../utils/assetPreloader';
import { getOrCreateUser } from '../../utils/supabase';

import bgBase from '../../assets/figma-welcome/фон для эксперимента.png';
import bgPattern from '../../assets/figma-welcome/pattern.png';
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

      console.log('🔍 SplashScreen: User data:', JSON.stringify(user));
      console.log('🔍 SplashScreen: subscription_type =', user?.subscription_type);

      if (user && user.subscription_type === 'premium') {
        console.log('✅ Premium user - going to dashboard');
        navigate('/main-dashboard-premium');
      } else {
        console.log('✅ Free user (or no user) - going to welcome. User:', user);
        navigate('/welcome');
      }
    };

    init();
  }, [navigate]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      background: '#020101',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Слой 1: базовый фон */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${bgBase})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }} />

      {/* Слой 2: паттерн точек */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${bgPattern})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat',
      }} />

      {/* Слой 3: градиент */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(2,1,1,0) 0%, rgba(2,1,1,0.6) 100%)',
      }} />

      {/* Лого по центру */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <img
          src={logo}
          alt="МЕТАФЛОРА*"
          style={{
            width: 'min(80vw, 438px)',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};
