import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';
import { AboutVideoPlayer } from '../../components/AboutVideoPlayer';

import serviceBtn from '../../assets/about-screens/кнопка перейти к сервису.png';
import expandPlashka from '../../assets/tour-video/плашка развернуть видео.png';

export const AboutPromptScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '94px', top: '207px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            как устроена МЕТАФЛОРА* цех
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

          <img
            src={expandPlashka}
            alt="развернуть видео"
            style={{
              position: 'absolute',
              left: '31.43%',
              right: '31.43%',
              top: '91.15%',
              bottom: '3.43%',
              width: '37.14%',
              height: '5.42%',
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
        </div>

        <img
          src={serviceBtn}
          alt="перейти к сервису"
          onClick={() => navigate('/prompt-first')}
          className="button-inner-glow"
          style={{ position: 'absolute', left: '143px', top: '1902px', width: '894px', height: '139px', cursor: 'pointer' }}
        />

        <Footer />
      </div>
    </div>
  );
};
