import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Ассеты из Figma
import patternDots from '../../assets/figma-welcome/pattern.png';
import splashLogo from '../../assets/figma-welcome/splash-logo.png';

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
        backgroundColor: '#020101',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Фон с паттерном точек */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#020101',
          backgroundImage: `url(${patternDots})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
        }}
      />

      {/* Логотип с пульсацией */}
      <img
        src={splashLogo}
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
