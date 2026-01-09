import { useNavigate } from 'react-router-dom';

// Импорт всех элементов
import headerFooter from '../../assets/welcome-elements/хэдер и подвал.png';
import carousel1 from '../../assets/welcome-elements/первое в карусели.png';
import carousel2 from '../../assets/welcome-elements/второе в карусели.png';
import carousel3 from '../../assets/welcome-elements/третье в карусели.png';
import pagination from '../../assets/welcome-elements/крутилка.png';
import btnTour from '../../assets/welcome-elements/кнопка экскурсия по платформе.png';
import btnTry from '../../assets/welcome-elements/кнопка попробовать бесплатно.png';
import supportBg from '../../assets/welcome-elements/написать в поддержку подложка.png';
import supportText from '../../assets/welcome-elements/написать в поддержку.png';
import legalLeft from '../../assets/welcome-elements/нажимая на кнопку, вы соглашаетесь с политикой конфиденциальности МЕТАФЛОРА_.png';
import legalRight from '../../assets/welcome-elements/нажимая на кнопку, вы соглашаетесь на получение информационной и рекламной рассылки МЕТАФЛОРА_.png';

// Размеры фрейма из CSS
const DESIGN_W = 1180;
const DESIGN_H = 2550;

export const WelcomeScreen = () => {
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

        {/* Заголовок */}
        <div
          style={{
            position: 'absolute',
            left: 94,
            top: 337,
            width: 938,
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 80,
            lineHeight: '100px',
          }}
        >
          добро пожаловать<br />в МЕТАФЛОРУ*
        </div>

        {/* Описание */}
        <div
          style={{
            position: 'absolute',
            left: 94,
            top: 522,
            width: 922,
            color: '#ffffff',
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: 40,
            lineHeight: '40px',
          }}
        >
          обучайтесь AI прямо в Telegram<br />
          с <span style={{ fontWeight: 800 }}>МЕТАФЛОРОЙ*</span>: академия, лаба, цех<br />
          и другие сервисы
        </div>

        {/* Карусель - 3 картинки (530x930 по CSS) */}
        <img
          src={carousel1}
          alt=""
          style={{
            position: 'absolute',
            left: -203,
            top: 789,
            width: 609,
            height: 973,
            borderRadius: 40,
          }}
        />
        <img
          src={carousel2}
          alt=""
          style={{
            position: 'absolute',
            left: 325,
            top: 789,
            width: 530,
            height: 930,
            borderRadius: 40,
          }}
        />
        <img
          src={carousel3}
          alt=""
          style={{
            position: 'absolute',
            left: 774,
            top: 789,
            width: 609,
            height: 973,
            borderRadius: 40,
          }}
        />

        {/* Pagination (крутилка) */}
        <img
          src={pagination}
          alt=""
          style={{
            position: 'absolute',
            left: 531,
            top: 1790,
            width: 119,
            height: 17,
          }}
        />

        {/* Кнопка "экскурсия по платформе" (892x139 по CSS) */}
        <button
          onClick={() => navigate('/tour-video')}
          style={{
            position: 'absolute',
            left: 144,
            top: 1899,
            width: 892,
            height: 139,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img
            src={btnTour}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              left: 0,
              top: 0,
            }}
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
              lineHeight: '100px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            экскурсия по платформе
          </span>
        </button>

        {/* Кнопка "попробовать бесплатно" (892x139 по CSS) */}
        <button
          onClick={() => navigate('/demo-access')}
          style={{
            position: 'absolute',
            left: 144,
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
            src={btnTry}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              left: 0,
              top: 0,
            }}
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
              lineHeight: '100px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            попробовать бесплатно
          </span>
        </button>

        {/* Кнопка "написать в поддержку" (205x78 по CSS) */}
        <button
          onClick={() => window.open('https://t.me/mishchenko_is', '_blank')}
          style={{
            position: 'absolute',
            left: 824,
            top: 237,
            width: 205,
            height: 78,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img
            src={supportBg}
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
            src={supportText}
            alt=""
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 145,
              height: 40,
            }}
          />
        </button>

        {/* Legal текст слева */}
        <img
          src={legalLeft}
          alt=""
          style={{
            position: 'absolute',
            left: 137,
            top: 2225,
            width: 399,
            height: 60,
            opacity: 0.6,
          }}
        />

        {/* Legal текст справа */}
        <img
          src={legalRight}
          alt=""
          style={{
            position: 'absolute',
            left: 601,
            top: 2225,
            width: 428,
            height: 60,
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
};
