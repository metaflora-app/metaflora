import { useNavigate } from 'react-router-dom';

// Import all elements
import bgDots from '../../assets/welcome/elements/фон точки.png';
import headerFooter from '../../assets/welcome/elements/хэдер и подвал.png';
import carousel1 from '../../assets/welcome/elements/первое в карусели.png';
import carousel2 from '../../assets/welcome/elements/второе в карусели.png';
import carousel3 from '../../assets/welcome/elements/третье в карусели.png';
import pagination from '../../assets/welcome/elements/крутилка.png';
import buttonTourBg from '../../assets/welcome/elements/кнопка экскурсия по платформе.png';
import buttonTourText from '../../assets/welcome/elements/экскурсия по платформе.png';
import buttonTryBg from '../../assets/welcome/elements/кнопка попробовать бесплатно.png';
import buttonTryText from '../../assets/welcome/elements/попробовать бесплатно.png';
import supportBg from '../../assets/welcome/elements/написать в поддержку подложка.png';
import supportText from '../../assets/welcome/elements/написать в поддержку.png';

// Размеры фрейма Figma
const DESIGN_W = 1180;
const DESIGN_H = 2550;

export const WelcomeScreen = () => {
  const navigate = useNavigate();
  
  // Масштаб по ширине экрана
  const scale = window.innerWidth / DESIGN_W;
  const scaledHeight = DESIGN_H * scale;

  // Вспомогательная функция для позиционирования
  const pos = (x: number, y: number, w: number, h: number) => ({
    position: 'absolute' as const,
    left: x,
    top: y,
    width: w,
    height: h,
  });

  return (
    <div 
      className="relative w-full bg-black"
      style={{ height: `${scaledHeight}px` }}
    >
      {/* Контейнер с масштабированием */}
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
          style={pos(0, 0, 1180, 2550)}
          className="pointer-events-none"
        />

        {/* Хэдер и подвал (лого, футер, соцсети) */}
        <img
          src={headerFooter}
          alt=""
          style={pos(0, 0, 1180, 2550)}
          className="pointer-events-none"
        />

        {/* Заголовок - текст */}
        <h1
          style={{
            position: 'absolute',
            left: 94,
            top: 337,
            width: 938,
            color: '#fff',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 80,
            lineHeight: '80px',
            margin: 0,
          }}
        >
          добро пожаловать <br />в МЕТАФЛОРУ*
        </h1>

        {/* Описание - текст */}
        <p
          style={{
            position: 'absolute',
            left: 94,
            top: 522,
            width: 922,
            color: '#fff',
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

        {/* Карусель */}
        <img
          src={carousel1}
          alt=""
          style={{
            position: 'absolute',
            left: -203,
            top: 789,
            width: 609,
            height: 973,
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
          }}
        />

        {/* Pagination */}
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

        {/* Кнопка "экскурсия по платформе" */}
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
          <img
            src={buttonTourText}
            alt=""
            style={{ width: '100%', height: '100%', position: 'absolute', left: 0, top: 0 }}
          />
        </button>

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
            src={buttonTryText}
            alt=""
            style={{ width: '100%', height: '100%', position: 'absolute', left: 0, top: 0 }}
          />
        </button>

        {/* Кнопка "написать в поддержку" */}
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
          <img
            src={supportText}
            alt=""
            style={{ width: '100%', height: '100%', position: 'absolute', left: 0, top: 0 }}
          />
        </button>

        {/* Legal текст слева */}
        <p
          style={{
            position: 'absolute',
            left: 137,
            top: 2225,
            width: 399,
            color: '#fff',
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

        {/* Legal текст справа */}
        <p
          style={{
            position: 'absolute',
            left: 601,
            top: 2225,
            width: 428,
            color: '#fff',
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
