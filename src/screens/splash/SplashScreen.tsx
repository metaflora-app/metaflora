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

  useEffect(() => {
    // Start preloading ALL images immediately
    preloadAllImages().then(() => {
      setImagesLoaded(true);
    });

    // Initialize or get user from Supabase and check subscription
    const initUser = async () => {
      try {
        const user = await getOrCreateUser();
        if (user && user.subscription_type === 'premium') {
          console.log('✅ Premium user detected, skipping onboarding');
          // Skip onboarding for premium users
          setTimeout(() => {
            navigate('/main-dashboard-premium');
          }, 3000); // Show splash for 3 seconds then go to dashboard
        }
      } catch (err) {
        console.error('Failed to initialize user:', err);
      }
    };
    
    initUser();

    // Minimum 8 seconds display for free users
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Navigate only when BOTH conditions met: images loaded AND 8 seconds passed
  // (only for free users - premium users skip this)
  useEffect(() => {
    if (imagesLoaded && minTimeElapsed) {
      // Check if we already navigated to premium dashboard
      getOrCreateUser().then(user => {
        if (user && user.subscription_type !== 'premium') {
          navigate('/welcome');
        }
      });
    }
  }, [imagesLoaded, minTimeElapsed, navigate]);

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
