import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUser } from '../../utils/supabase';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';
import { AboutAcademyVidstackPlayer } from '../../components/AboutAcademyVidstackPlayer';

import btnFree from '../../assets/welcome-elements/кнопка попробовать бесплатно.png';

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

        <AboutAcademyVidstackPlayer title="экскурсия по платформе за 2 минуты" />

        <img src={btnFree} alt="попробовать бесплатно" onClick={() => navigate('/demo-access')} className="button-inner-glow" style={{
          position: 'absolute', left: '143px', top: '1902px', width: '894px', height: '139px', cursor: 'pointer',
        }} />

        <Footer />
      </div>
    </div>
  );
};
