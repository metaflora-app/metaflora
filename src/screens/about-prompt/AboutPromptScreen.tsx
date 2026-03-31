import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';
import { AboutAcademyVidstackPlayer } from '../../components/AboutAcademyVidstackPlayer';

import serviceBtn from '../../assets/about-screens/кнопка перейти к сервису.png';

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

        <AboutAcademyVidstackPlayer title="как устроена МЕТАФЛОРА* цех" controlsVariant="full" />

        <img
          src={serviceBtn}
          alt="перейти к сервису"
          onClick={() => navigate('/prompt-first')}
          className="button-inner-glow motion-press-grow"
          style={{ position: 'absolute', left: '143px', top: '1902px', width: '894px', height: '139px', cursor: 'pointer' }}
        />

        <Footer />
      </div>
    </div>
  );
};
