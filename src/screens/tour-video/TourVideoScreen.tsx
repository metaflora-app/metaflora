import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUser } from '../../utils/supabase';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';

import btnFree from '../../assets/welcome-elements/кнопка попробовать бесплатно.png';
import expandPlashka from '../../assets/tour-video/плашка развернуть видео.png';
import tourVideo from '../../assets/tour-video/мастерская в окошке флоры.mp4';

export const TourVideoScreen: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    getOrCreateUser().then(user => {
      if (user?.subscription_type === 'premium') navigate('/main-dashboard-premium', { replace: true });
    });
  }, [navigate]);

  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header />

        <div style={{ position: 'absolute', left: '92px', top: '197px', width: '1000px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            экскурсия по платформе
          </p>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            за 2 минуты
          </p>
        </div>

        {/* Видео 894×1457px */}
        <div style={{
          position: 'absolute', left: '143px', top: '410px',
          width: '894px', height: '1457px', borderRadius: '40px', overflow: 'hidden',
        }}>
          <video autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
            <source src={tourVideo} type="video/mp4" />
          </video>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '220px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
          }} />
          <img src={expandPlashka} alt="развернуть видео" style={{
            position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
            width: '500px', height: 'auto', cursor: 'pointer',
          }} />
        </div>

        <img src={btnFree} alt="попробовать бесплатно" onClick={() => navigate('/demo-access')} className="button-inner-glow" style={{
          position: 'absolute', left: '143px', top: '1902px', width: '894px', height: '139px', cursor: 'pointer',
        }} />

        <Footer />
      </div>
    </div>
  );
};
