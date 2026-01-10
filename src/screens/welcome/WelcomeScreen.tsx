import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Ассеты из Figma
import patternDots from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import cardCenter from '../../assets/figma-welcome/carousel-center.png';
import cardLeft from '../../assets/figma-welcome/carousel-left.png';
import cardRight from '../../assets/figma-welcome/carousel-right.png';
import footerLogo from '../../assets/figma-welcome/footer-logo.png';
import socialsImg from '../../assets/figma-welcome/socials.png';

// Размеры дизайна из Figma
const DESIGN_W = 1180;
const DESIGN_H = 2550;

export const WelcomeScreen = () => {
  const navigate = useNavigate();

  const computeScale = () => {
    if (typeof window === 'undefined') return 1;
    return Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
  };

  const [scale, setScale] = useState(computeScale);

  useEffect(() => {
    const handler = () => setScale(computeScale());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const scaledHeight = useMemo(() => DESIGN_H * scale, [scale]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#000',
        height: `${scaledHeight}px`,
        overflow: 'hidden',
      }}
    >
      {/* Контейнер с масштабированием - точные размеры из Figma */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          overflow: 'hidden',
        }}
      >
        {/* Фон с паттерном точек */}
        <div
          style={{
            position: 'absolute',
            width: DESIGN_W,
            height: DESIGN_H,
            backgroundColor: '#000',
            backgroundImage: `url(${patternDots})`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
          }}
        />

        {/* Маленький логотип - w-48 h-36 left-[479px] top-[138px] */}
        <div
          style={{
            position: 'absolute',
            width: 192, // w-48 = 12rem = 192px
            height: 144, // h-36 = 9rem = 144px
            left: 479,
            top: 138,
          }}
        >
          <img
            src={logoSmall}
            alt="МЕТАФЛОРА"
            style={{
              width: 190,
              height: 138,
              position: 'absolute',
              left: 0,
              top: 0,
            }}
          />
        </div>

        {/* Кнопка поддержки - w-52 h-20 left-[824px] top-[198px] */}
        <button
          onClick={() => window.open('https://t.me/mishchenko_is', '_blank')}
          style={{
            position: 'absolute',
            width: 208, // w-52 = 13rem = 208px
            height: 80, // h-20 = 5rem = 80px
            left: 824,
            top: 198,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 62,
            border: '4px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(50px)',
            WebkitBackdropFilter: 'blur(50px)',
            overflow: 'hidden',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 144, // w-36
              left: 38,
              top: 18,
              textAlign: 'center',
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: 20,
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 400,
                lineHeight: '20px',
              }}
            >
              написать
              <br />
            </span>
            <span
              style={{
                color: 'white',
                fontSize: 20,
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 700,
                lineHeight: '20px',
              }}
            >
              в поддержку
            </span>
          </div>
        </button>

        {/* Заголовок - left-[94px] top-[298px] */}
        <div
          style={{
            position: 'absolute',
            left: 94,
            top: 298,
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: 72, // text-7xl
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              lineHeight: '80px',
            }}
          >
            добро пожаловать
            <br />
            в МЕТАФЛОРУ*
          </div>
        </div>

        {/* Описание - left-[94px] top-[483px] */}
        <div
          style={{
            position: 'absolute',
            left: 94,
            top: 483,
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div>
            <span
              style={{
                color: 'white',
                fontSize: 36, // text-4xl
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 400,
                lineHeight: '40px',
              }}
            >
              обучайтесь AI прямо в Telegram
              <br />
            </span>
            <span
              style={{
                color: 'white',
                fontSize: 36,
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 700,
                lineHeight: '40px',
              }}
            >
              с МЕТАФЛОРОЙ*:
            </span>
            <span
              style={{
                color: 'white',
                fontSize: 36,
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 400,
                lineHeight: '40px',
              }}
            >
              {' '}
              академия, лаба, цех
              <br />и другие сервисы
            </span>
          </div>
        </div>

        {/* Карусель - левая: left-[-213px] top-[740px] rotate-[-5deg] */}
        <div
          style={{
            position: 'absolute',
            left: -213,
            top: 740,
            padding: 10,
            display: 'inline-flex',
            justifyContent: 'start',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <img
            src={cardLeft}
            alt=""
            style={{
              width: 530,
              height: 930,
              transformOrigin: 'top left',
              transform: 'rotate(-5deg)',
              borderRadius: 40,
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Карусель - центр: left-[315px] top-[740px] */}
        <div
          style={{
            position: 'absolute',
            left: 315,
            top: 740,
            padding: 10,
            display: 'inline-flex',
            justifyContent: 'start',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <img
            src={cardCenter}
            alt=""
            style={{
              width: 530,
              height: 930,
              borderRadius: 40,
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Карусель - правая: left-[764px] top-[740px] rotate-[-175deg] */}
        <div
          style={{
            position: 'absolute',
            left: 764,
            top: 740,
            padding: 10,
            display: 'inline-flex',
            justifyContent: 'start',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <img
            src={cardRight}
            alt=""
            style={{
              width: 530,
              height: 930,
              transformOrigin: 'top left',
              transform: 'rotate(-175deg)',
              borderRadius: 40,
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Pagination - left-[531px] top-[1751px] */}
        <div
          style={{
            position: 'absolute',
            left: 531,
            top: 1751,
            display: 'inline-flex',
            justifyContent: 'start',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              background: '#d4d4d4', // zinc-300
              borderRadius: 33,
            }}
          />
          <div
            style={{
              width: 64, // w-16
              height: 16,
              background: 'white',
              borderRadius: 33,
            }}
          />
          <div
            style={{
              width: 16,
              height: 16,
              background: '#d4d4d4',
              borderRadius: 33,
            }}
          />
        </div>

        {/* Кнопка экскурсия - w-[892px] h-36 left-[147px] top-[1860px] */}
        <button
          onClick={() => navigate('/tour-video')}
          style={{
            position: 'absolute',
            width: 892,
            height: 144, // h-36 = 9rem = 144px
            left: 147,
            top: 1860,
            padding: 10,
            borderRadius: 62,
            border: '4px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(50px)',
            WebkitBackdropFilter: 'blur(50px)',
            background: 'transparent',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 320,
            top: 1900,
            padding: 10,
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              color: 'white',
              fontSize: 36,
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 400,
              lineHeight: '40px',
            }}
          >
            экскурсия по платформе
          </div>
        </div>

        {/* Кнопка попробовать бесплатно - w-[892px] h-36 left-[147px] top-[2018px] */}
        <button
          onClick={() => navigate('/demo-access')}
          style={{
            position: 'absolute',
            width: 892,
            height: 144,
            left: 147,
            top: 2018,
            background: 'rgba(0,0,0,0.9)',
            borderRadius: 62,
            border: '4px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(50px)',
            WebkitBackdropFilter: 'blur(50px)',
            overflow: 'hidden',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {/* Цветные круги градиента */}
          <div
            style={{
              position: 'absolute',
              width: 575.78,
              height: 384, // h-96
              left: 145,
              top: -189.57,
              background: '#22d3ee', // cyan-400
              borderRadius: 9999,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 476.73,
              height: 208, // h-52
              left: 333.66,
              top: -203.51,
              transformOrigin: 'top left',
              transform: 'rotate(12deg)',
              background: '#facc15', // yellow-400
              borderRadius: 9999,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 320, // w-80
              height: 288, // h-72
              left: 403.64,
              top: 73.04,
              background: '#bef264', // lime-300
              borderRadius: 9999,
            }}
          />
        </button>
        {/* Текст кнопки попробовать */}
        <div
          style={{
            position: 'absolute',
            left: 332,
            top: 2058,
            padding: 10,
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              color: 'white',
              fontSize: 36,
              fontFamily: 'Gotham Pro, sans-serif',
              fontWeight: 400,
              lineHeight: '40px',
            }}
          >
            попробовать бесплатно
          </div>
        </div>

        {/* Подвал - w-[904px] h-48 left-[125px] top-[2186px] */}
        <div
          style={{
            position: 'absolute',
            width: 904,
            height: 192, // h-48
            left: 125,
            top: 2186,
          }}
        >
          {/* Лого в подвале - w-[587px] h-32 left-0 top-[70px] */}
          <img
            src={footerLogo}
            alt="МЕТАФЛОРА"
            style={{
              position: 'absolute',
              width: 587,
              height: 128, // h-32
              left: 0,
              top: 70,
            }}
          />

          {/* Подложка под соцсети - w-56 h-20 left-[674px] top-[93px] */}
          <div
            style={{
              position: 'absolute',
              width: 224, // w-56
              height: 80, // h-20
              left: 674,
              top: 93,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 62,
              border: '4px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(50px)',
              WebkitBackdropFilter: 'blur(50px)',
            }}
          />

          {/* Соцсети иконки */}
          <img
            src={socialsImg}
            alt="Соцсети"
            style={{
              position: 'absolute',
              width: 142,
              height: 51,
              left: 745,
              top: 107,
              opacity: 0.6,
            }}
          />

          {/* Legal левый - left-[22px] top-0 */}
          <div
            style={{
              position: 'absolute',
              width: 384, // w-96
              left: 22,
              top: 0,
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: 20,
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 400,
                lineHeight: '20px',
              }}
            >
              нажимая на кнопку, вы соглашаетесь
              <br />
            </span>
            <span
              style={{
                color: 'white',
                fontSize: 20,
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 700,
                lineHeight: '20px',
              }}
            >
              с политикой конфиденциальности
            </span>
            <span
              style={{
                color: 'white',
                fontSize: 20,
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 400,
                lineHeight: '20px',
              }}
            >
              {' '}
            </span>
            <span
              style={{
                color: 'white',
                fontSize: 20,
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 700,
                lineHeight: '20px',
              }}
            >
              МЕТАФЛОРА*
            </span>
          </div>

          {/* Legal правый - left-[476px] top-0 text-right */}
          <div
            style={{
              position: 'absolute',
              width: 384,
              left: 476,
              top: 0,
              textAlign: 'right',
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: 20,
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 400,
                lineHeight: '20px',
              }}
            >
              нажимая на кнопку, вы соглашаетесь
              <br />
            </span>
            <span
              style={{
                color: 'white',
                fontSize: 20,
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 700,
                lineHeight: '20px',
              }}
            >
              на получение информационной
              <br />
              и рекламной рассылки
            </span>
            <span
              style={{
                color: 'white',
                fontSize: 20,
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 400,
                lineHeight: '20px',
              }}
            >
              {' '}
            </span>
            <span
              style={{
                color: 'white',
                fontSize: 20,
                fontFamily: 'Gotham Pro, sans-serif',
                fontWeight: 700,
                lineHeight: '20px',
              }}
            >
              МЕТАФЛОРА*
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
