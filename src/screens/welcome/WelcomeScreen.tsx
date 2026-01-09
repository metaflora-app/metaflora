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
      style={{ height: `${scaledHeight}px`, overflow: 'hidden' }}
    >
      {/* ЖЕСТКИЙ контейнер - все элементы внутри масштабируются вместе */}
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          left: 0,
          top: 0,
        }}
      >
        {/* Фон с точками - layer 1 */}
        <img
          src={bgDots}
          alt=""
          style={{ position: 'absolute', left: 0, top: 0, width: 1180, height: 2550, pointerEvents: 'none' }}
        />

        {/* Хэдер и подвал - layer 2 */}
        <img
          src={headerFooter}
          alt=""
          style={{ position: 'absolute', left: 0, top: 0, width: 1180, height: 2550, pointerEvents: 'none' }}
        />

        {/* Заголовок - layer 3 (7:2754: x=1366, y=1743) */}
        <h1
          style={{
            position: 'absolute',
            left: 94,
            top: 337,
            width: 938,
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

        {/* Описание - layer 4 (7:2755: x=1366, y=1928) */}
        <p
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
            margin: 0,
          }}
        >
          обучайтесь AI прямо в Telegram <br />
          с <span style={{ fontWeight: 800 }}>МЕТАФЛОРОЙ*</span>: академия, лаба, цех <br />
          и другие сервисы
        </p>

        {/* Карусель - layer 5 */}
        <img
          src={carousel1}
          alt=""
          style={{ position: 'absolute', left: -203, top: 789, width: 609, height: 973, borderRadius: 40, pointerEvents: 'none' }}
        />
        <img
          src={carousel2}
          alt=""
          style={{ position: 'absolute', left: 325, top: 789, width: 530, height: 930, borderRadius: 40, pointerEvents: 'none' }}
        />
        <img
          src={carousel3}
          alt=""
          style={{ position: 'absolute', left: 774, top: 789, width: 609, height: 973, borderRadius: 40, pointerEvents: 'none' }}
        />

        {/* Pagination - layer 6 (7:2758: x=1803, y=3196) */}
        <img
          src={pagination}
          alt=""
          style={{ position: 'absolute', left: 531, top: 1790, width: 119, height: 17, pointerEvents: 'none' }}
        />

        {/* Кнопка "экскурсия" - layer 7 (7:2756: x=1419, y=3305) ОБНОВЛЕНО */}
        <button
          onClick={() => navigate('/tour-video')}
          style={{
            position: 'absolute',
            left: 147,
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

        {/* Кнопка "попробовать" - layer 8 (7:2767: x=1419, y=3463) ОБНОВЛЕНО */}
        <button
          onClick={() => navigate('/demo-access')}
          style={{
            position: 'absolute',
            left: 147,
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

        {/* Кнопка "поддержка" - layer 9 (7:2773: x=2096, y=1643) */}
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
            }}
          >
            написать <br />в поддержку
          </span>
        </button>

        {/* Legal текст слева - layer 10 (7:2783: x=1419, y=3631) ОБНОВЛЕНО */}
        <p
          style={{
            position: 'absolute',
            left: 147,
            top: 2225,
            width: 399,
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

        {/* Legal текст справа - layer 11 (7:2784: x=1873, y=3631) */}
        <p
          style={{
            position: 'absolute',
            left: 601,
            top: 2225,
            width: 428,
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
};
