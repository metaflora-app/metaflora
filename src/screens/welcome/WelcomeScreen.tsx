import { useNavigate } from 'react-router-dom';

// Import только графические элементы (без текста)
import bgDots from '../../assets/welcome/elements/фон точки.png';
import headerFooter from '../../assets/welcome/elements/хэдер и подвал.png';
import carousel1 from '../../assets/welcome/elements/первое в карусели.png';
import carousel2 from '../../assets/welcome/elements/второе в карусели.png';
import carousel3 from '../../assets/welcome/elements/третье в карусели.png';
import pagination from '../../assets/welcome/elements/крутилка.png';
import buttonTourBg from '../../assets/welcome/elements/кнопка экскурсия по платформе.png';
import buttonTryBg from '../../assets/welcome/elements/кнопка попробовать бесплатно.png';
import supportBg from '../../assets/welcome/elements/написать в поддержку подложка.png';

// Размеры фрейма Figma
const DESIGN_W = 1180;
const DESIGN_H = 2550;

export const WelcomeScreen = () => {
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
        {/* Фон с точками */}
        <img
          src={bgDots}
          alt=""
          style={{ position: 'absolute', left: 0, top: 0, width: 1180, height: 2550 }}
          className="pointer-events-none"
        />

        {/* Хэдер и подвал (лого, футер, соцсети) */}
        <img
          src={headerFooter}
          alt=""
          style={{ position: 'absolute', left: 0, top: 0, width: 1180, height: 2550 }}
          className="pointer-events-none"
        />

        {/* Заголовок - КОД из Figma (7:2754) */}
        <h1
          style={{
            position: 'absolute',
            left: 94,
            top: 337,
            width: 938,
            height: 160,
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 80,
            lineHeight: '80px',
            margin: 0,
          }}
        >
          добро пожаловать <br />в МЕТАФЛОРУ*
        </h1>

        {/* Описание - КОД из Figma (7:2755) */}
        <p
          style={{
            position: 'absolute',
            left: 94,
            top: 522,
            width: 922,
            height: 120,
            color: '#ffffff',
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: 40,
            lineHeight: '40px',
            margin: 0,
          }}
        >
          обучайтесь AI прямо в Telegram <br />
          с <span style={{ fontWeight: 800 }}>МЕТАФЛОРОЙ*</span>: академия, лаба, цех <br />
          и другие сервисы
        </p>

        {/* Карусель - PNG из Figma (7:2762, 7:2764, 7:2763) */}
        <img
          src={carousel1}
          alt=""
          style={{ position: 'absolute', left: -203, top: 789, width: 609, height: 973, borderRadius: 40 }}
        />
        <img
          src={carousel2}
          alt=""
          style={{ position: 'absolute', left: 325, top: 789, width: 530, height: 930, borderRadius: 40 }}
        />
        <img
          src={carousel3}
          alt=""
          style={{ position: 'absolute', left: 774, top: 789, width: 609, height: 973, borderRadius: 40 }}
        />

        {/* Pagination - PNG из Figma (7:2758) */}
        <img
          src={pagination}
          alt=""
          style={{ position: 'absolute', left: 531, top: 1790, width: 119, height: 17 }}
        />

        {/* Кнопка "экскурсия по платформе" - фон PNG + текст КОД (7:2756, 7:2757) */}
        <button
          onClick={() => navigate('/tour-video')}
          style={{
            position: 'absolute',
            left: 128,
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
            src={buttonTourBg}
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
            экскурсия по платформе
          </span>
        </button>

        {/* Кнопка "попробовать бесплатно" - фон PNG + текст КОД (7:2767, 7:2772) */}
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

        {/* Кнопка "написать в поддержку" - фон PNG + текст КОД (7:2773, 7:2774) */}
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
            style={{ width: '100%', height: '100%', position: 'absolute', left: 0, top: 0 }}
          />
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

        {/* Legal текст слева - КОД из Figma (7:2783) */}
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
            fontWeight: 300,
            fontSize: 20,
            lineHeight: '20px',
            margin: 0,
          }}
        >
          нажимая на кнопку, вы соглашаетесь <br />
          с политикой конфиденциальности МЕТАФЛОРА*
        </p>

        {/* Legal текст справа - КОД из Figma (7:2784) */}
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
            fontWeight: 300,
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
};
