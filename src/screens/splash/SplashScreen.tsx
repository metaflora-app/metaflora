import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { preloadAllImages } from '../../utils/assetPreloader';
import { getOrCreateUser } from '../../utils/supabase';

// Background pattern image (dots)
import bgPattern from '../../assets/figma-welcome/pattern.png';
// Logo image
import logo from '../../assets/figma-welcome/splash-logo.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Start preloading ALL images immediately
    preloadAllImages().then(() => {
      setImagesLoaded(true);
    });

    // Initialize or get user from Supabase and check subscription
    const initUser = async () => {
      try {
        const user = await getOrCreateUser();
        if (user) {
          console.log('✅ User subscription type:', user.subscription_type);
          setIsPremium(user.subscription_type === 'premium');
        }
        setUserChecked(true);
      } catch (err) {
        console.error('Failed to initialize user:', err);
        setUserChecked(true);
      }
    };
    
    initUser();

    // Minimum 3 seconds display
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Navigate when ready
  useEffect(() => {
    if (imagesLoaded && minTimeElapsed && userChecked) {
      if (isPremium) {
        console.log('✅ Navigating to premium dashboard');
        navigate('/main-dashboard-premium');
      } else {
        console.log('✅ Navigating to welcome (free user)');
        navigate('/welcome');
      }
    }
  }, [imagesLoaded, minTimeElapsed, userChecked, isPremium, navigate]);

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
