import { useNavigate } from 'react-router-dom';

// Import all elements
import bgDots from '../../assets/tour-video/elements/фон точки.png';
import headerFooter from '../../assets/tour-video/elements/хэдер и подвал.png';
import title from '../../assets/tour-video/elements/экскурсия по платформе за 2 минуты.png';
import videoFrame from '../../assets/tour-video/elements/видео с обзором.png';
import videoControls from '../../assets/tour-video/elements/Frame 2131330093.png';
import backButton from '../../assets/tour-video/elements/выход.png';
import supportText from '../../assets/tour-video/elements/написать в поддержку.png';
import buttonTryBg from '../../assets/tour-video/elements/кнопка попробовать бесплатно.png';
import buttonTryText1 from '../../assets/tour-video/elements/попробовать бесплатно.png';

// Размеры фрейма Figma
const DESIGN_W = 1180;
const DESIGN_H = 2550;

export default function TourVideoScreen() {
  const navigate = useNavigate();
  
  const scale = window.innerWidth / DESIGN_W;
  const scaledHeight = DESIGN_H * scale;

  return (
    <div 
      className="relative w-full bg-black"
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
          }}
          className="pointer-events-none"
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
          }}
          className="pointer-events-none"
        />

        {/* Кнопка "выход" (назад) */}
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

        {/* Кнопка "написать в поддержку" */}
        <button
          onClick={() => window.open('https://t.me/mishchenko_is', '_blank')}
          style={{
            position: 'absolute',
            right: 120,
            top: 237,
            width: 205,
            height: 78,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img src={supportText} alt="" style={{ width: '100%', height: '100%' }} />
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
            height: 80,
          }}
          className="pointer-events-none"
        />

        {/* Видео фрейм */}
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
            src={videoFrame}
            alt=""
            style={{ width: '100%', height: '100%' }}
            className="pointer-events-none"
          />
          
          {/* Контролы видео (play/pause/fullscreen) */}
          <img
            src={videoControls}
            alt=""
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
            }}
            className="pointer-events-none"
          />
        </div>

        {/* Кнопка "попробовать бесплатно" */}
        <button
          onClick={() => navigate('/demo-access')}
          style={{
            position: 'absolute',
            left: 128,
            top: 2057,
            width: 892,
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
          <img
            src={buttonTryText1}
            alt=""
            style={{ width: '100%', height: '100%', position: 'absolute', left: 0, top: 0 }}
          />
        </button>
      </div>
    </div>
  );
}
