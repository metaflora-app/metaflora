import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../../components/ScreenLayout';
import leftPanelGif from '../../assets/laba-search/left-panel.gif';

const SIDEBAR_HOTSPOTS = [
  { left: 331, top: 1890, width: 82, height: 94, route: '/laba-main' },
  { left: 466, top: 1890, width: 82, height: 94, route: '/laba-no-tracked' },
  { left: 602, top: 1890, width: 82, height: 94, route: '/laba-favorites' },
  { left: 737, top: 1890, width: 82, height: 94, route: '/metacoins' },
];
const SIDEBAR_PILL_POSITIONS = [14, 149, 285, 420];

const logoSmall = 'https://www.figma.com/api/mcp/asset/6cc89443-e3dd-4f50-8766-f7549c24f1c1';
const backgroundBase = 'https://www.figma.com/api/mcp/asset/ae38eb1c-b28c-46b9-a9c2-040a5cec66df';
const backgroundOverlayOne = 'https://www.figma.com/api/mcp/asset/edb83794-7120-4b6d-bdf8-b2fe59317848';
const backgroundOverlayTwo = 'https://www.figma.com/api/mcp/asset/b07f8e3a-732f-48a5-b5e5-a44c34d31812';
const sidebarIcons = 'https://www.figma.com/api/mcp/asset/962a497e-6ecb-4126-9133-052b82178b43';

export const LabaSearchScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [pillOffset, setPillOffset] = React.useState(SIDEBAR_PILL_POSITIONS[1]);
  const [isDraggingSidebar, setIsDraggingSidebar] = React.useState(false);
  const dragRef = React.useRef<{ pointerId: number; startX: number; startOffset: number } | null>(null);

  const snapToSidebarIndex = React.useCallback((index: number) => {
    const safeIndex = Math.max(0, Math.min(index, SIDEBAR_PILL_POSITIONS.length - 1));
    setPillOffset(SIDEBAR_PILL_POSITIONS[safeIndex]);
    window.setTimeout(() => navigate(SIDEBAR_HOTSPOTS[safeIndex].route), 160);
  }, [navigate]);

  const handleSidebarPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: pillOffset,
    };
    setIsDraggingSidebar(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSidebarPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const delta = event.clientX - dragRef.current.startX;
    const min = SIDEBAR_PILL_POSITIONS[0];
    const max = SIDEBAR_PILL_POSITIONS[SIDEBAR_PILL_POSITIONS.length - 1];
    setPillOffset(Math.max(min, Math.min(max, dragRef.current.startOffset + delta)));
  };

  const handleSidebarPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const nearestIndex = SIDEBAR_PILL_POSITIONS.reduce((bestIndex, position, index) => {
      const bestDistance = Math.abs(SIDEBAR_PILL_POSITIONS[bestIndex] - pillOffset);
      const nextDistance = Math.abs(position - pillOffset);
      return nextDistance < bestDistance ? index : bestIndex;
    }, 0);
    dragRef.current = null;
    setIsDraggingSidebar(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    snapToSidebarIndex(nearestIndex);
  };

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
          className={`glass-sidebar-track ${isDraggingSidebar ? 'is-dragging' : ''}`}
          onPointerDown={handleSidebarPointerDown}
          onPointerMove={handleSidebarPointerMove}
          onPointerUp={handleSidebarPointerEnd}
          onPointerCancel={handleSidebarPointerEnd}
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
          <div className="glass-sidebar-pill" style={{ transform: `translateX(${pillOffset}px)` }} />
          <div style={{ position: 'absolute', left: '0', top: '21px', width: '534px', height: '98px', overflow: 'hidden', pointerEvents: 'none' }}>
            <img
              src={sidebarIcons}
              alt="сайдбар иконки новые"
              style={{ position: 'absolute', height: '544.9%', left: 0, top: '-222.45%', width: '100%', maxWidth: 'none' }}
            />
          </div>
        </div>

        {SIDEBAR_HOTSPOTS.map((item, index) => (
          <button
            key={item.route}
            type="button"
            onClick={() => snapToSidebarIndex(index)}
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
              padding: 0,
            }}
          />
        ))}

        <Footer />
      </div>
    </div>
  );
};
