import { useNavigate } from 'react-router-dom';

// Импорт элементов
import bgDots from '../../assets/tour-elements/фон точки.png';
import headerFooter from '../../assets/tour-elements/хэдер и подвал.png';
import videoPreview from '../../assets/tour-elements/видео с обзором.png';
import exitBtn from '../../assets/tour-elements/выход.png';
import supportBtn from '../../assets/tour-elements/Frame 2131330093.png';
import title from '../../assets/tour-elements/экскурсия по платформе за 2 минуты.png';
import btnTryBg from '../../assets/tour-elements/кнопка попробовать бесплатно.png';
import btnTryText from '../../assets/tour-elements/попробовать бесплатно.png';

// Размеры фрейма
const DESIGN_W = 1180;
const DESIGN_H = 2550;

export const TourScreen = () => {
  const navigate = useNavigate();
  const scale = window.innerWidth / DESIGN_W;
  const scaledHeight = DESIGN_H * scale;

  return (
    <div 
      className="relative w-full bg-[#020101]"
      style={{ height: `${scaledHeight}px`, overflow: 'hidden' }}
    >
      {/* Контейнер с масштабированием */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Фон черный */}
        <div style={{
          position: 'absolute',
          width: 1180,
          height: 2550,
          background: '#000000',
        }} />

        {/* Фон с точками */}
        <img
          src={bgDots}
          alt=""
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1180,
            height: 2550,
            pointerEvents: 'none',
          }}
        />

        {/* Хэдер и подвал */}
        <img
          src={headerFooter}
          alt=""
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1180,
            height: 2550,
            pointerEvents: 'none',
          }}
        />

        {/* Кнопка выхода (слева вверху) */}
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
          <img
            src={exitBtn}
            alt=""
            style={{ width: '100%', height: '100%' }}
          />
        </button>

        {/* Кнопка поддержки (справа вверху) */}
        <button
          onClick={() => window.open('https://t.me/mishchenko_is', '_blank')}
          style={{
            position: 'absolute',
            left: 1106,
            top: 238,
            width: 205,
            height: 78,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img
            src={supportBtn}
            alt=""
            style={{ width: '100%', height: '100%' }}
          />
        </button>

        {/* Заголовок */}
        <img
          src={title}
          alt=""
          style={{
            position: 'absolute',
            left: 94,
            top: 337,
            width: 1027,
            height: 160,
          }}
        />

        {/* Видео превью (891x1457 по CSS) */}
        <div
          style={{
            position: 'absolute',
            left: 144,
            top: 556,
            width: 891,
            height: 1457,
          }}
        >
          <img
            src={videoPreview}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 40,
              objectFit: 'cover',
            }}
          />
          
          {/* Overlay с рамкой */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 30,
              pointerEvents: 'none',
            }}
          />

          {/* Кнопка Play (по центру видео) */}
          <button
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 98,
              height: 98,
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 62,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 36,
            }}
          >
            ►
          </button>

          {/* Кнопка Expand (правый нижний угол видео) */}
          <button
            style={{
              position: 'absolute',
              right: 20,
              bottom: 20,
              width: 72,
              height: 72,
              background: 'rgba(0, 0, 0, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 62,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 28,
            }}
          >
            ⤢
          </button>
        </div>

        {/* Кнопка "попробовать бесплатно" (891x139 по CSS) */}
        <button
          onClick={() => navigate('/demo-access')}
          style={{
            position: 'absolute',
            left: 144,
            top: 1068,
            width: 891,
            height: 139,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img
            src={btnTryBg}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              left: 0,
              top: 0,
            }}
          />
          <img
            src={btnTryText}
            alt=""
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 527,
              height: 40,
            }}
          />
        </button>

        {/* Legal тексты (y=1244) */}
        <div
          style={{
            position: 'absolute',
            left: 137,
            top: 1244,
            width: 399,
            height: 60,
            color: '#fff',
            opacity: 0.6,
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 300,
            fontSize: 20,
            lineHeight: '20px',
          }}
        >
          нажимая на кнопку, вы соглашаетесь<br />
          с политикой конфиденциальности МЕТАФЛОРА*
        </div>
        <div
          style={{
            position: 'absolute',
            left: 601,
            top: 1244,
            width: 428,
            height: 60,
            color: '#fff',
            opacity: 0.6,
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 300,
            fontSize: 20,
            lineHeight: '20px',
            textAlign: 'right',
          }}
        >
          нажимая на кнопку, вы соглашаетесь<br />
          на получение информационной<br />
          и рекламной рассылки МЕТАФЛОРА*
        </div>

        {/* Copyright */}
        <div
          style={{
            position: 'absolute',
            left: 136,
            top: 1400,
            width: 282,
            height: 40,
            color: '#fff',
            opacity: 0.6,
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 300,
            fontSize: 20,
            lineHeight: '20px',
          }}
        >
          Copyright ©<br />
          Все права защищены.
        </div>

        {/* Соцсети кнопка */}
        <div
          style={{
            position: 'absolute',
            left: 799,
            top: 1313,
            width: 230,
            height: 78,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 62,
          }}
        />
      </div>
    </div>
  );
};
