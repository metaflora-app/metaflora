import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import leftGif from '../../assets/laba-redesign/слева.gif';
import sidebarBg from '../../assets/laba-redesign/сайдбар подложка.png';
import sidebarIcons from '../../assets/laba-redesign/сайдбар иконки новые.png';

const SIDEBAR_HOTSPOTS = [
  { left: 348, width: 82, route: '/laba-main' },
  { left: 443, width: 82, route: '/laba-no-tracked' },
  { left: 538, width: 82, route: '/laba-favorites' },
  { left: 633, width: 82, route: '/metacoins' },
];

export const LabaLoadingScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '85px', top: '193px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            МЕТАФЛОРА* лаба
          </p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '760px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            забудьте о часах поиска и анализа видео - доверьте это ИИ
          </p>
        </div>

        <div style={{ position: 'absolute', left: '141px', top: '400px', width: '428px', height: '1643px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden' }}>
          <img src={leftGif} alt="слева" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ position: 'absolute', left: '601px', top: '404px', width: '428px', height: '1643px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden' }}>
          <img src={leftGif} alt="справа" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <button
          type="button"
          onClick={() => navigate('/laba-main')}
          style={{
            position: 'absolute',
            left: '503px',
            top: '760px',
            width: '174px',
            height: '72px',
            border: 'none',
            background: 'rgba(255,255,255,0.88)',
            borderRadius: '30px',
            color: '#000',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '19px',
            cursor: 'pointer',
          }}
        >
          открыть
        </button>

        <div style={{ position: 'absolute', left: '320px', top: '1863px', width: '530px', height: '139px' }}>
          <img src={sidebarBg} alt="сайдбар подложка" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
          <img src={sidebarIcons} alt="сайдбар иконки новые" style={{ position: 'absolute', left: '-2px', top: '21px', width: '534px', height: '98px', objectFit: 'contain', pointerEvents: 'none' }} />
          {SIDEBAR_HOTSPOTS.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              style={{
                position: 'absolute',
                left: `${item.left - 320}px`,
                top: '20px',
                width: `${item.width}px`,
                height: '100px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        <Footer />
      </div>
    </div>
  );
};
