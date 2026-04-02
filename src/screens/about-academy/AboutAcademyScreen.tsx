import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';
import { AboutAcademyVidstackPlayer } from '../../components/AboutAcademyVidstackPlayer';
import { MagnifiedText } from '../../components/MagnifiedText';

import serviceBtn from '../../assets/about-screens/кнопка перейти к сервису.png';

export const AboutAcademyScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '94px', top: '199px', width: '1000px' }}>
          <MagnifiedText
            text="как устроена МЕТАФЛОРА* академия"
            style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}
          />
        </div>

        <AboutAcademyVidstackPlayer controlsVariant="full" />

        <button
          type="button"
          onClick={() => navigate('/academy-courses-all')}
          className="motion-press-grow"
          style={{
            position: 'absolute',
            left: '143px',
            top: '1902px',
            width: '894px',
            height: '139px',
            cursor: 'pointer',
            padding: 0,
            border: 'none',
            background: 'transparent',
          }}
        >
          <img
            src={serviceBtn}
            alt="перейти к сервису"
            className="button-inner-glow"
            style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }}
          />
        </button>

        <Footer />
      </div>
    </div>
  );
};
