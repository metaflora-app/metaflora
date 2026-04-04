import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';
import { AboutAcademyVidstackPlayer } from '../../components/AboutAcademyVidstackPlayer';

import serviceBtn from '../../assets/about-screens/кнопка перейти к сервису.png';
import aboutWorkshopVideo from '../../assets/about-screens/about-workshop.mp4';
import aboutMetafloraPoster from '../../assets/about-screens/about-metaflora-poster.png';

export const AboutPromptScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [isPressed, setIsPressed] = React.useState(false);

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

        <AboutAcademyVidstackPlayer src={aboutWorkshopVideo} posterSrc={aboutMetafloraPoster} title="как устроена МЕТАФЛОРА* цех" controlsVariant="full" />

        <button
          type="button"
          className={`motion-press-grow ${isPressed ? 'is-pressed' : ''}`}
          onPointerDown={() => {
            setIsPressed(true);
            navigate('/prompt-first');
          }}
          onPointerUp={() => setIsPressed(false)}
          onPointerLeave={() => setIsPressed(false)}
          onPointerCancel={() => setIsPressed(false)}
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
