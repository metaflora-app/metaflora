import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import patternDots from '../../assets/welcome-v2/pattern.png';
import footerLogo from '../../assets/welcome-v2/footer-logo.png';

export const SplashScreen = () => {
  const navigate = useNavigate();
  const DELAY_MS = 4000;

  useEffect(() => {
    // Auto-redirect to welcome after short delay
    const timer = setTimeout(() => {
      navigate('/welcome', { replace: true });
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#000',
          backgroundImage: `url(${patternDots})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
          opacity: 1,
        }}
      />

      <img
        src={footerLogo}
        alt="МЕТАФЛОРА"
        style={{
          width: 340,
          height: 'auto',
          objectFit: 'contain',
          animation: 'splashPulse 2.2s ease-in-out infinite',
          zIndex: 1,
        }}
      />
    </div>
  );
};

export default SplashScreen;
