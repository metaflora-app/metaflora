import { useNavigate } from 'react-router-dom';

// Import только графические элементы (без текста)
import bgDots from '../../assets/tour-video/elements/фон точки.png';
import headerFooter from '../../assets/tour-video/elements/хэдер и подвал.png';
import videoFrame from '../../assets/tour-video/elements/видео с обзором.png';
import backButton from '../../assets/tour-video/elements/выход.png';
import buttonTryBg from '../../assets/tour-video/elements/кнопка попробовать бесплатно.png';

// Размеры фрейма Figma "экран с экскурсией"
const DESIGN_W = 1180;
const DESIGN_H = 2550;

export default function TourVideoScreen() {
  const navigate = useNavigate();
  
  const scale = window.innerWidth / DESIGN_W;
  const scaledHeight = DESIGN_H * scale;

  return (
    <div 
      className="relative w-full bg-[#020101]"
      style={{ height: `${scaledHeight}px` }}
    >
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'relative',
        }}
      >
        {/* Фон с точками (7:100) */}
        <img
          src={bgDots}
          alt=""
          style={{ position: 'absolute', left: 0, top: 0, width: 1180, height: 2550 }}
          className="pointer-events-none"
        />

        {/* Хэдер и подвал (7:154) */}
        <img
          src={headerFooter}
          alt=""
          style={{ position: 'absolute', left: 0, top: 0, width: 1180, height: 2550 }}
          className="pointer-events-none"
        />

        {/* Заголовок - КОД из Figma (7:129) */}
        <h1
          style={{
            position: 'absolute',
            left: 94,
            top: 337,
            width: 1027,
            height: 160,
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 80,
            lineHeight: '80px',
            margin: 0,
          }}
        >
          экскурсия по платформе за 2 минуты
        </h1>

        {/* Видео фрейм (7:131, 7:132) */}
        <img
          src={videoFrame}
          alt=""
          style={{
            position: 'absolute',
            left: 144,
            top: 556,
            width: 891,
            height: 1457,
            borderRadius: 40,
          }}
          className="pointer-events-none"
        />

        {/* Кнопка "выход" (назад) (7:144) */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            left: 120,
            top: 251,
            width: 81,
            height: 64,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img src={backButton} alt="" style={{ width: '100%', height: '100%' }} />
        </button>

        {/* Кнопка "написать в поддержку" - фон прозрачный + текст КОД (7:152, 7:153) */}
        <button
          onClick={() => window.open('https://t.me/mishchenko_is', '_blank')}
          style={{
            position: 'absolute',
            left: 850,
            top: 237,
            width: 205,
            height: 78,
            borderRadius: 62,
            backgroundColor: 'rgba(255,255,255,0.10)',
            border: '4px solid rgba(255,255,255,0.30)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 38,
              top: 19,
              color: '#ffffff',
              fontFamily: '"Gotham Pro", system-ui, sans-serif',
              fontWeight: 300,
              fontSize: 20,
              lineHeight: '20px',
              textAlign: 'left',
            }}
          >
            написать <br />в поддержку
          </span>
        </button>

        {/* Кнопка "попробовать бесплатно" - фон PNG + текст КОД (7:146, 7:151) */}
        <button
          onClick={() => navigate('/demo-access')}
          style={{
            position: 'absolute',
            left: 144,
            top: 2056,
            width: 891,
            height: 139,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img
            src={buttonTryBg}
            alt=""
            style={{ width: '100%', height: '100%', position: 'absolute', left: 0, top: 0 }}
          />
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#ffffff',
              fontFamily: '"Gotham Pro", system-ui, sans-serif',
              fontWeight: 500,
              fontSize: 40,
              lineHeight: '40px',
              whiteSpace: 'nowrap',
            }}
          >
            попробовать бесплатно
          </span>
        </button>

        {/* Legal текст слева (7:127) */}
        <p
          style={{
            position: 'absolute',
            left: 137,
            top: 2225,
            width: 399,
            height: 60,
            color: '#ffffff',
            opacity: 0.6,
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 20,
            lineHeight: '20px',
            margin: 0,
          }}
        >
          нажимая на кнопку, вы соглашаетесь <br />
          с политикой конфиденциальности МЕТАФЛОРА*
        </p>

        {/* Legal текст справа (7:128) */}
        <p
          style={{
            position: 'absolute',
            left: 601,
            top: 2225,
            width: 428,
            height: 60,
            color: '#ffffff',
            opacity: 0.6,
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 20,
            lineHeight: '20px',
            textAlign: 'right',
            margin: 0,
          }}
        >
          нажимая на кнопку, вы соглашаетесь <br />
          на получение информационной <br />
          и рекламной рассылки МЕТАФЛОРА*
        </p>
      </div>
    </div>
  );
}
