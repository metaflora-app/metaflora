import React from 'react';
import { useNavigate } from 'react-router-dom';
import leftPanelGif from '../../assets/laba-search/left-panel.gif';

const SIDEBAR_HOTSPOTS = [
  { left: 331, top: 1890, width: 82, height: 94, route: '/laba-main' },
  { left: 466, top: 1890, width: 82, height: 94, route: '/laba-no-tracked' },
  { left: 602, top: 1890, width: 82, height: 94, route: '/laba-favorites' },
  { left: 737, top: 1890, width: 82, height: 94, route: '/metacoins' },
];

const logoSmall = 'https://www.figma.com/api/mcp/asset/6cc89443-e3dd-4f50-8766-f7549c24f1c1';
const logoFooter = 'https://www.figma.com/api/mcp/asset/8cbffe4a-e50d-4dbf-9309-c70270c1a013';
const socialsSprite = 'https://www.figma.com/api/mcp/asset/47e834b0-2ec2-47a5-86c2-d642f138fe3b';
const backgroundBase = 'https://www.figma.com/api/mcp/asset/ae38eb1c-b28c-46b9-a9c2-040a5cec66df';
const backgroundOverlayOne = 'https://www.figma.com/api/mcp/asset/edb83794-7120-4b6d-bdf8-b2fe59317848';
const backgroundOverlayTwo = 'https://www.figma.com/api/mcp/asset/b07f8e3a-732f-48a5-b5e5-a44c34d31812';
const sidebarIcons = 'https://www.figma.com/api/mcp/asset/962a497e-6ecb-4126-9133-052b82178b43';

export const LabaSearchScreen: React.FC = () => {
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

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '882px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            забудьте о часах поиска и анализа видео - доверьте это ИИ
          </p>
        </div>

        <div style={{ position: 'absolute', left: '141px', top: '400px', width: '428px', height: '1643px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden' }}>
          <img src={leftPanelGif} alt="слева" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ position: 'absolute', left: '601px', top: '400px', width: '428px', height: '1643px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden' }}>
          <img src={leftPanelGif} alt="справа" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
        />

        <div style={{ position: 'absolute', left: '320px', top: '1884px', width: '534px', height: '98px', overflow: 'hidden', pointerEvents: 'none' }}>
          <img
            src={sidebarIcons}
            alt="сайдбар иконки новые"
            style={{ position: 'absolute', height: '544.9%', left: 0, top: '-222.45%', width: '100%', maxWidth: 'none' }}
          />
        </div>

        {SIDEBAR_HOTSPOTS.map((item) => (
          <button
            key={item.route}
            type="button"
            onClick={() => navigate(item.route)}
            style={{
              position: 'absolute',
              left: `${item.left}px`,
              top: `${item.top}px`,
              width: `${item.width}px`,
              height: `${item.height}px`,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              zIndex: 2,
            }}
          />
        ))}

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

          <div style={{ position: 'absolute', left: '434px', top: '13px', width: '50px', height: '51px', overflow: 'hidden' }}>
            <img
              src={socialsSprite}
              alt=""
              style={{ position: 'absolute', height: '339.84%', left: '-377.92%', top: '-118.33%', width: '517.92%', maxWidth: 'none' }}
            />
          </div>

          <div style={{ position: 'absolute', left: '488px', top: '13px', width: '40px', height: '51px', overflow: 'hidden' }}>
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
