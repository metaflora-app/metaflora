import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThreeBg, Header, Footer } from '../../components/ScreenLayout';

import serviceBtn from '../../assets/about-screens/кнопка перейти к сервису.png';
import expandPlashka from '../../assets/tour-video/плашка развернуть видео.png';

export const AboutAcademyScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const handleExpandVideo = React.useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
      }

      if (video.requestFullscreen) {
        await video.requestFullscreen();
      }
    } catch (error) {
      console.error('Error expanding academy intro video:', error);
    }
  }, []);

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

        <div style={{ position: 'absolute', left: '142px', top: '401px', width: '894px', height: '1457px' }}>
          <video
            ref={videoRef}
            src="/about-academy-test-video.mp4"
            playsInline
            preload="auto"
            controls={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '40px',
              background: '#000',
            }}
          />

          <button
            type="button"
            onClick={handleExpandVideo}
            style={{
              position: 'absolute',
              left: '31.43%',
              right: '31.43%',
              top: '91.15%',
              bottom: '3.43%',
              width: '37.14%',
              height: '5.42%',
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <img
              src={expandPlashka}
              alt="развернуть видео"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          </button>
        </div>

        <img src={serviceBtn} alt="перейти к сервису" onClick={() => navigate('/academy-courses-all')} className="button-inner-glow" style={{
          position: 'absolute', left: '143px', top: '1902px', width: '894px', height: '139px', cursor: 'pointer',
        }} />

        <Footer />
      </div>
    </div>
  );
};
