import React from 'react';
import { useNavigate } from 'react-router-dom';

const SIDEBAR_HOTSPOTS = [
  { left: 348, width: 82, route: '/laba-main' },
  { left: 443, width: 82, route: '/laba-no-tracked' },
  { left: 538, width: 82, route: '/laba-favorites' },
  { left: 633, width: 82, route: '/metacoins' },
];

const logoSmall = 'https://www.figma.com/api/mcp/asset/f2f1ca68-2fb4-4d5a-8d6d-34f287876db2';
const logoFooter = 'https://www.figma.com/api/mcp/asset/7da9b2fe-dfd7-4732-ae25-5aa83a866b32';
const socialsSprite = 'https://www.figma.com/api/mcp/asset/d629a3f2-2652-4835-beb5-e92f18c575e4';
const backgroundBase = 'https://www.figma.com/api/mcp/asset/173fa76f-6222-4474-a5bf-5b13867e8101';
const backgroundOverlayOne = 'https://www.figma.com/api/mcp/asset/6b530d83-a34d-450c-a57f-591d3d626a48';
const backgroundOverlayTwo = 'https://www.figma.com/api/mcp/asset/a4be7998-3b3e-4525-805c-8ee89aed3244';
const panelImage = 'https://www.figma.com/api/mcp/asset/fd052944-1073-42ab-8209-fd4258eee3d1';
const sidebarIcons = 'https://www.figma.com/api/mcp/asset/9ebf6eec-fec1-4fbb-8182-478f848886ab';

export const LabaLoadingScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div style={{ position: 'absolute', left: '-153px', top: '-71px', width: '1485px', height: '2660px', pointerEvents: 'none' }}>
          <img src={backgroundBase} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <img src={backgroundOverlayOne} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
          <img src={backgroundOverlayTwo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <button
          type="button"
          onClick={() => navigate('/main-dashboard-premium')}
          style={{ position: 'absolute', left: '500px', top: '61px', width: '186px', height: '131px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
        >
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <img
              src={logoSmall}
              alt="МЕТАФЛОРА*"
              style={{ position: 'absolute', height: '131.84%', left: '-21.84%', top: '-16.38%', width: '143.34%', maxWidth: 'none' }}
            />
          </div>
        </button>

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
          <img src={panelImage} alt="слева" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ position: 'absolute', left: '601px', top: '404px', width: '428px', height: '1643px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden' }}>
          <img src={panelImage} alt="справа" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: '320px',
            top: '1863px',
            width: '530px',
            height: '139px',
            borderRadius: '62px',
            border: '4px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.1)',
            backdropFilter: 'blur(50px)',
          }}
        >
          <img
            src={sidebarIcons}
            alt="сайдбар иконки новые"
            style={{ position: 'absolute', left: 0, top: '21px', width: '534px', height: '98px', objectFit: 'contain', pointerEvents: 'none' }}
          />
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

        <div style={{ position: 'absolute', left: '141px', top: '2071px', width: '888px', height: '124px' }}>
          <div style={{ position: 'absolute', left: '2px', top: '-16px', width: '380px', height: '83px' }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <img
                src={logoFooter}
                alt="МЕТАФЛОРА*"
                style={{ position: 'absolute', height: '526.54%', left: '-37.89%', top: '-202.47%', width: '170.37%', maxWidth: 'none' }}
              />
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              left: '2px',
              top: '56px',
              width: '433px',
              fontFamily: 'Cygre',
              fontWeight: 400,
              fontSize: '20px',
              lineHeight: '1',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Copyright © Все права защищены
          </div>

          <div
            style={{
              position: 'absolute',
              left: '417px',
              top: '-3px',
              width: '247px',
              height: '79px',
              borderRadius: '62px',
              border: '4px solid rgba(255,255,255,0.3)',
              background: '#000',
              backdropFilter: 'blur(50px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Cygre',
              fontWeight: 400,
              fontSize: '27px',
              color: '#fff',
            }}
          >
            поддержка
          </div>

          <div
            style={{
              position: 'absolute',
              left: '664px',
              top: '-2px',
              width: '230px',
              height: '78px',
              borderRadius: '62px',
              border: '4px solid rgba(255,255,255,0.3)',
              background: '#000',
              backdropFilter: 'blur(50px)',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', left: '111px', top: '11px', width: '94px', height: '51px', opacity: 0.3, overflow: 'hidden' }}>
              <img
                src={socialsSprite}
                alt=""
                style={{ position: 'absolute', height: '339.84%', left: '-76.21%', top: '-118.33%', width: '277.42%', maxWidth: 'none' }}
              />
            </div>
          </div>

          <div style={{ position: 'absolute', left: '681px', top: '13px', width: '50px', height: '51px', overflow: 'hidden' }}>
            <img
              src={socialsSprite}
              alt=""
              style={{ position: 'absolute', height: '339.84%', left: '-377.92%', top: '-118.33%', width: '517.92%', maxWidth: 'none' }}
            />
          </div>

          <div style={{ position: 'absolute', left: '735px', top: '13px', width: '40px', height: '51px', overflow: 'hidden' }}>
            <img
              src={socialsSprite}
              alt=""
              style={{ position: 'absolute', height: '339.84%', left: '-59.08%', top: '-118.33%', width: '651.94%', maxWidth: 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
