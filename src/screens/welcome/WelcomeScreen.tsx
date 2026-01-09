import { useNavigate } from 'react-router-dom';

// Импорт элементов из папки
import bgImage from '../../assets/welcome-elements/хэдер и подвал.png';
import carousel1 from '../../assets/welcome-elements/первое в карусели.png';
import carousel2 from '../../assets/welcome-elements/второе в карусели.png';
import carousel3 from '../../assets/welcome-elements/третье в карусели.png';
import pagination from '../../assets/welcome-elements/крутилка.png';
import btnTourBg from '../../assets/welcome-elements/кнопка экскурсия по платформе.png';
import btnTryBg from '../../assets/welcome-elements/кнопка попробовать бесплатно.png';
import supportBtn from '../../assets/welcome-elements/написать в поддержку подложка.png';
import legalLeft from '../../assets/welcome-elements/нажимая на кнопку, вы соглашаетесь с политикой конфиденциальности МЕТАФЛОРА_.png';
import legalRight from '../../assets/welcome-elements/нажимая на кнопку, вы соглашаетесь на получение информационной и рекламной рассылки МЕТАФЛОРА_.png';

// Размеры дизайна
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
        {/* Background */}
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

        {/* Заголовок */}
        <h1
          style={{
            position: 'absolute',
            width: '79.49%',
            height: '6.27%',
            top: '13.22%',
            left: '7.97%',
            fontFamily: 'Inter, Helvetica',
            fontWeight: 800,
            color: 'white',
            fontSize: 80,
            lineHeight: '80px',
            margin: 0,
          }}
        >
          добро пожаловать<br />в МЕТАФЛОРУ*
        </h1>

        {/* Описание */}
        <p
          style={{
            position: 'absolute',
            width: '78.14%',
            height: '4.71%',
            top: '20.47%',
            left: '7.97%',
            fontFamily: 'Gotham Pro, Helvetica',
            fontWeight: 400,
            color: 'white',
            fontSize: 40,
            lineHeight: '40px',
            margin: 0,
          }}
        >
          обучайтесь AI прямо в Telegram<br />
          <span style={{ fontWeight: 700 }}>с МЕТАФЛОРОЙ*:</span> академия, лаба, цех<br />
          и другие сервисы
        </p>

        {/* Карусель - левая картинка */}
        <img
          style={{
            position: 'absolute',
            top: 753,
            left: 0,
            width: 403,
            height: 966,
            objectFit: 'cover',
          }}
          alt=""
          src={carousel1}
        />

        {/* Карусель - центральная картинка */}
        <img
          style={{
            position: 'absolute',
            top: 750,
            left: 325,
            width: 530,
            height: 930,
            objectFit: 'cover',
          }}
          alt=""
          src={carousel2}
        />

        {/* Карусель - правая картинка */}
        <img
          style={{
            position: 'absolute',
            top: 753,
            left: 777,
            width: 403,
            height: 966,
            objectFit: 'cover',
          }}
          alt=""
          src={carousel3}
        />

        {/* Pagination */}
        <img
          style={{
            position: 'absolute',
            top: 1751,
            left: 531,
            width: 119,
            height: 17,
          }}
          alt=""
          src={pagination}
        />

        {/* Кнопка "экскурсия по платформе" */}
        <button
          onClick={() => navigate('/tour-video')}
          style={{
            position: 'absolute',
            top: 1860,
            left: 'calc(50% - 446px)',
            width: 892,
            height: 139,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img
            src={btnTourBg}
            alt=""
            style={{ width: '100%', height: '100%' }}
          />
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#ffffff',
              fontFamily: 'Gotham Pro, Helvetica',
              fontWeight: 500,
              fontSize: 40,
              lineHeight: '100px',
              whiteSpace: 'nowrap',
            }}
          >
            экскурсия по платформе
          </span>
        </button>

        {/* Кнопка "попробовать бесплатно" */}
        <button
          onClick={() => navigate('/demo-access')}
          style={{
            position: 'absolute',
            top: 2018,
            left: 'calc(50% - 446px)',
            width: 892,
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
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#ffffff',
              fontFamily: 'Gotham Pro, Helvetica',
              fontWeight: 500,
              fontSize: 40,
              lineHeight: '100px',
              whiteSpace: 'nowrap',
            }}
          >
            попробовать бесплатно
          </span>
        </button>

        {/* Кнопка поддержки */}
        <button
          onClick={() => window.open('https://t.me/mishchenko_is', '_blank')}
          style={{
            position: 'absolute',
            top: 198,
            left: 'calc(50% + 234px)',
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

        {/* Legal тексты */}
        <img
          style={{
            position: 'absolute',
            top: '87.25%',
            left: 'calc(50% - 452px)',
            width: 380,
            height: 60,
          }}
          alt=""
          src={legalLeft}
        />

        <img
          style={{
            position: 'absolute',
            top: '87.25%',
            left: 'calc(50% + 72px)',
            width: 395,
            height: 60,
          }}
          alt=""
          src={legalRight}
        />
      </div>
    </div>
  );
};
