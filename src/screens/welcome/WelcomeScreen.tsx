import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import welcomeScreenNoBtns from '../../assets/screens/welcome-screen-no-buttons.png';

// Размеры фрейма Figma
const DESIGN_W = 1180;
const DESIGN_H = 2550;

export const WelcomeScreen = () => {
  const navigate = useNavigate();
  const vw = window.innerWidth;
  
  // Масштаб строго по ширине (как было раньше)
  const scale = useMemo(() => vw / DESIGN_W, [vw]);
  const scaledHeight = DESIGN_H * scale;
  
  const pos = (x: number, y: number) => ({ left: x, top: y });

  return (
    <div 
      className="relative w-full bg-[#020101]"
      style={{ height: `${scaledHeight}px`, overflow: 'hidden' }}
    >
      {/* PNG фона без кнопок */}
      <img
        src={welcomeScreenNoBtns}
        alt="МЕТАФЛОРА"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />

      {/* Контейнер для живых кнопок поверх PNG */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Кнопка "экскурсия по платформе" (x=128 y=1899 w=892 h=139) */}
        <button
          onClick={() => navigate('/tour-video')}
          className="animated-border"
          style={{
            position: 'absolute',
            ...pos(128, 1899),
            width: 892,
            height: 139,
            borderRadius: 62,
            border: '4px solid rgba(255,255,255,0.30)',
            background: 'transparent',
            color: '#fff',
            textAlign: 'center',
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 500,
            fontSize: 40,
            lineHeight: '40px',
            cursor: 'pointer',
          }}
        >
          экскурсия по платформе
        </button>

        {/* Кнопка "попробовать бесплатно" с анимированным градиентом */}
        <button
          onClick={() => navigate('/demo-access')}
          className="animated-border"
          style={{
            position: 'absolute',
            ...pos(128, 2057),
            width: 892,
            height: 139,
            borderRadius: 62,
            background: 'linear-gradient(90deg, #00e8ff 0%, #00dff5 18%, #f0d825 50%, #b6ff3c 78%, #00e8ff 100%)',
            border: '5px solid rgba(255,255,255,0.35)',
            overflow: 'hidden',
            color: '#fff',
            textAlign: 'center',
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 500,
            fontSize: 40,
            lineHeight: '40px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.6) 100%)',
              pointerEvents: 'none',
            }}
          />
          <span style={{ position: 'relative', zIndex: 1 }}>попробовать бесплатно</span>
        </button>
      </div>
    </div>
  );
};
