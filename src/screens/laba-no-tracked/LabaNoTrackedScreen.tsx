import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import trackingGif from '../../assets/laba-redesign/tracked-screen.gif';
import startTrackingButton from '../../assets/laba-redesign/start-tracking-button.png';

export const LabaNoTrackedScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '85px', top: '193px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            новое отслеживание
          </p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '820px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            добавьте любой аккаунт в отслеживание и получайте новые видео ежедневно
          </p>
        </div>

        <div style={{ position: 'absolute', left: '143px', top: '402px', width: '894px', height: '1643px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden' }}>
          <img src={trackingGif} alt="видео с отслеживанием экран" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <button
          type="button"
          onClick={() => navigate('/laba-search-account')}
          className="premium-button-shell button-inner-glow motion-press-grow"
          style={{ position: 'absolute', left: '325px', top: '1169px', width: '530px', height: '139px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', zIndex: 2, borderRadius: '62px', overflow: 'hidden' }}
        >
          <div className="premium-button-inner" />
          <img
            src={startTrackingButton}
            alt="начать отслеживание"
            className="button-inner-glow"
            style={{ position: 'absolute', inset: '2px', width: 'calc(100% - 4px)', height: 'calc(100% - 4px)', objectFit: 'contain', pointerEvents: 'none', zIndex: 2 }}
          />
        </button>

        <div
          style={{
            position: 'absolute',
            left: '343px',
            top: '1318px',
            width: '495px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Cygre',
            fontWeight: 400,
            fontSize: '32px',
            lineHeight: '1',
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          вы можете пополнить баланс в личном кабинете
        </div>

        <Footer />
      </div>
    </div>
  );
};
