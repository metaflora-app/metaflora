import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';

import serviceBtn from '../../assets/about-screens/кнопка перейти к сервису.png';
import expandPlashka from '../../assets/tour-video/плашка развернуть видео.png';
import aboutVideo from '../../assets/tour-video/мастерская в окошке флоры.mp4';

export const AboutAcademyScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '94px', top: '199px', width: '1000px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            как устроена МЕТАФЛОРА* академия
          </p>
        </div>

        {/* Видео 894×1457px */}
        <div style={{
          position: 'absolute', left: '143px', top: '410px',
          width: '894px', height: '1457px', borderRadius: '40px', overflow: 'hidden',
        }}>
          <video autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
            <source src={aboutVideo} type="video/mp4" />
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

        <img src={serviceBtn} alt="перейти к сервису" onClick={() => navigate('/academy-courses-all')} className="button-inner-glow" style={{
          position: 'absolute', left: '143px', top: '1902px', width: '894px', height: '139px', cursor: 'pointer',
        }} />

        <Footer />
      </div>
    </div>
  );
};
