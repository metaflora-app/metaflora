import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUser } from '../../utils/supabase';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';
import { AboutVideoPlayer } from '../../components/AboutVideoPlayer';

import btnFree from '../../assets/welcome-elements/кнопка попробовать бесплатно.png';
import figmaShadow from '../../assets/tour-video/figma-shadow.png';

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

        <div style={{ position: 'absolute', left: '142px', top: '401px', width: '894px', height: '1457px' }}>
          <AboutVideoPlayer style={{ left: '0px', top: '0px', width: '894px', height: '1457px', borderRadius: '40px' }} />

          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(50px)',
            background: 'rgba(255,255,255,0.1)',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '30px',
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: '710.92px',
            transform: 'translateX(-50%)',
            width: '104.375px',
            height: '104.375px',
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}>
            <img src={figmaShadow} alt="" style={{ position: 'absolute', inset: '-104.3%', width: '308.6%', height: '308.6%', maxWidth: 'none' }} />
          </div>

          <div style={{
            position: 'absolute',
            left: '31.43%',
            right: '31.43%',
            top: '91.15%',
            bottom: '3.43%',
            backdropFilter: 'blur(50px)',
            background: 'rgba(0,0,0,0.1)',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '62px',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '245px',
              textAlign: 'center',
              fontFamily: 'Cygre',
              fontWeight: 400,
              fontSize: '27px',
              lineHeight: '1',
              color: 'white',
            }}>
              развернуть видео на полный экран
            </div>
          </div>
        </div>

        <img src={btnFree} alt="попробовать бесплатно" onClick={() => navigate('/demo-access')} className="button-inner-glow" style={{
          position: 'absolute', left: '143px', top: '1902px', width: '894px', height: '139px', cursor: 'pointer',
        }} />

        <Footer />
      </div>
    </div>
  );
};
