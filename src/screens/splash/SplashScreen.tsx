import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

export const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to welcome after 2.5 seconds
    const timer = setTimeout(() => {
      navigate('/welcome', { replace: true });
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#020101]">
      {/* Background pattern */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1.2px, transparent 1.2px)',
          backgroundSize: '32px 32px',
        }}
      />
      
      {/* Logo */}
      <img
        src={logo}
        alt="МЕТАФЛОРА"
        className="w-[300px] h-auto animate-pulse"
      />
    </div>
  );
};

export default SplashScreen;
