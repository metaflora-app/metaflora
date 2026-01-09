import { useNavigate } from 'react-router-dom';

// Импорт элементов из папки
import bgImage from '../../assets/tour-elements/хэдер и подвал.png';
import bgDots from '../../assets/tour-elements/фон точки.png';
import title from '../../assets/tour-elements/экскурсия по платформе за 2 минуты.png';
import videoPreview from '../../assets/tour-elements/видео с обзором.png';
import exitBtn from '../../assets/tour-elements/выход.png';
import supportBtn from '../../assets/tour-elements/Frame 2131330093.png';
import btnTryBg from '../../assets/tour-elements/кнопка попробовать бесплатно.png';
import btnTryText from '../../assets/tour-elements/попробовать бесплатно.png';

// Размеры дизайна
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
        {/* Background image */}
        <img
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1180,
            height: 2550,
          }}
          alt="Background"
          src={bgImage}
        />

        {/* Dots background */}
        <img
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1180,
            height: 2550,
          }}
          alt=""
          src={bgDots}
        />

        {/* Legal text left */}
        <p
          style={{
            position: 'absolute',
            height: '2.35%',
            left: 'calc(50% - 446px)',
            top: '85.57%',
            width: 399,
            color: '#ffffff',
            fontFamily: 'Gotham Pro, Helvetica',
            fontSize: 20,
            fontWeight: 300,
            lineHeight: '20px',
            margin: 0,
          }}
        >
          нажимая на кнопку, вы соглашаетесь<br />
          <span style={{ fontWeight: 700 }}>с политикой конфиденциальности МЕТАФЛОРА*</span>
        </p>

        {/* Legal text right */}
        <p
          style={{
            position: 'absolute',
            height: '2.35%',
            left: 'calc(50% + 9px)',
            top: '85.57%',
            width: 428,
            color: '#ffffff',
            fontFamily: 'Gotham Pro, Helvetica',
            fontSize: 20,
            fontWeight: 300,
            lineHeight: '20px',
            textAlign: 'right',
            margin: 0,
          }}
        >
          нажимая на кнопку, вы соглашаетесь<br />
          <span style={{ fontWeight: 700 }}>на получение информационной<br />и рекламной рассылки МЕТАФЛОРА*</span>
        </p>

        {/* Title */}
        <img
          style={{
            position: 'absolute',
            height: '6.27%',
            left: '7.99%',
            top: '13.22%',
            width: '87.03%',
          }}
          alt=""
          src={title}
        />

        {/* Video container (view) */}
        <div
          style={{
            position: 'absolute',
            left: 'calc(50% - 448px)',
            top: 513,
            width: 891,
            height: 1457,
            backgroundImage: `url(${videoPreview})`,
            backgroundPosition: '50% 50%',
            backgroundSize: 'cover',
          }}
        >
          {/* Overlay frame */}
          <div
            style={{
              position: 'absolute',
              left: 'calc(50% - 446px)',
              top: 0,
              width: 891,
              height: 1457,
              background: 'rgba(255, 255, 255, 0.1)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 30,
            }}
          />

          {/* Play button bottom */}
          <button
            style={{
              position: 'absolute',
              left: 'calc(50% - 46px)',
              top: 728,
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

          {/* Play button top */}
          <button
            style={{
              position: 'absolute',
              left: 'calc(50% - 48px)',
              top: 619,
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

          {/* Expand button */}
          <button
            style={{
              position: 'absolute',
              left: 'calc(50% + 360px)',
              top: 1368,
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

        {/* Exit button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            left: 'calc(50% - 464px)',
            top: 200,
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

        {/* Try button background */}
        <button
          onClick={() => navigate('/demo-access')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 448px)',
            top: 2013,
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
            style={{ width: '100%', height: '100%' }}
          />
          <img
            src={btnTryText}
            alt=""
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 496,
              height: 35,
            }}
          />
        </button>

        {/* Support button */}
        <button
          onClick={() => window.open('https://t.me/mishchenko_is', '_blank')}
          style={{
            position: 'absolute',
            left: 'calc(50% + 258px)',
            top: 194,
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
      </div>
    </div>
  );
};
