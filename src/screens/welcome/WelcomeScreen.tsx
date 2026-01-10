import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import patternDots from '../../assets/welcome-v2/pattern.png';
import logoSmall from '../../assets/welcome-v2/logo-small.png';
import cardCenter from '../../assets/welcome-v2/carousel-center.png';
import cardLeft from '../../assets/welcome-v2/carousel-left.png';
import cardRight from '../../assets/welcome-v2/carousel-right.png';
import footerLogo from '../../assets/welcome-v2/footer-logo.png';
import socialsImg from '../../assets/welcome/socials.png';

// Размеры дизайна
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
        backgroundColor: '#020101',
        height: `${scaledHeight}px`,
        overflow: 'hidden',
      }}
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
        {/* Фон с паттерном точек */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#000',
            backgroundImage: `url(${patternDots})`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
          }}
        />

        {/* Маленький логотип в хедере */}
        <img
          src={logoSmall}
          alt="МЕТАФЛОРА"
          style={{
            position: 'absolute',
            top: 110,
            left: '50%',
            width: 190,
            height: 138,
            transform: 'translateX(-50%)',
            objectFit: 'contain',
          }}
        />

        {/* Кнопка поддержки */}
        <button
          onClick={() => window.open('https://t.me/mishchenko_is', '_blank')}
          style={{
            position: 'absolute',
            top: 198,
            left: 'calc(50% + 234px)',
            width: 205,
            height: 78,
            background: 'rgba(255,255,255,0.1)',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: 62,
            backdropFilter: 'blur(50px)',
            color: '#fff',
            fontFamily: 'Gotham Pro, sans-serif',
            fontSize: 20,
            fontWeight: 300,
            lineHeight: '20px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
          aria-label="Написать в поддержку"
        >
          <span style={{ display: 'block', fontWeight: 300 }}>написать</span>
          <span style={{ display: 'block', fontWeight: 700 }}>в поддержку</span>
        </button>

        {/* Заголовок */}
        <h1
          style={{
            position: 'absolute',
            width: '79.49%',
            height: '6.27%',
            top: 337, // 13.22% of 2550
            left: 94, // 7.97% of 1180
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            color: 'white',
            fontSize: 80,
            lineHeight: '80px',
            margin: 0,
          }}
        >
          добро пожаловать
          <br />
          в МЕТАФЛОРУ*
        </h1>

        {/* Описание */}
        <p
          style={{
            position: 'absolute',
            width: 922, // 78.14% of 1180
            top: 523, // 20.47% of 2550
            left: 94,
            fontFamily: 'Gotham Pro, Helvetica, sans-serif',
            fontWeight: 400,
            color: 'white',
            fontSize: 40,
            lineHeight: '40px',
            margin: 0,
          }}
        >
          обучайтесь AI прямо в Telegram
          <br />
          <span style={{ fontWeight: 700 }}>с МЕТАФЛОРОЙ*:</span> академия, лаба, цех
          <br />
          и другие сервисы
        </p>

        {/* Карусель - левая карточка */}
        <img
          src={cardLeft}
          alt=""
          style={{
            position: 'absolute',
            top: 753,
            left: 0,
            width: 403,
            height: 966,
            objectFit: 'cover',
            borderRadius: 40,
            transform: 'rotate(-5deg)',
          }}
        />

        {/* Карусель - центральная карточка */}
        <img
          src={cardCenter}
          alt=""
          style={{
            position: 'absolute',
            top: 750,
            left: 325,
            width: 530,
            height: 930,
            objectFit: 'cover',
            borderRadius: 40,
          }}
        />

        {/* Карусель - правая карточка */}
        <img
          src={cardRight}
          alt=""
          style={{
            position: 'absolute',
            top: 753,
            left: 777,
            width: 403,
            height: 966,
            objectFit: 'cover',
            borderRadius: 40,
            transform: 'rotate(5deg)',
          }}
        />

        {/* Pagination */}
        <div
          style={{
            position: 'absolute',
            top: 1751,
            left: 531,
            width: 119,
            height: 17,
            display: 'flex',
            gap: 11,
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translateX(-1px)',
          }}
        >
          <div
            style={{
              width: 17,
              height: 17,
              background: '#d6d6d6',
              borderRadius: 33,
            }}
          />
          <div
            style={{
              width: 63,
              height: 17,
              background: '#fffdfe',
              borderRadius: 33,
            }}
          />
          <div
            style={{
              width: 17,
              height: 17,
              background: '#d6d6d6',
              borderRadius: 33,
            }}
          />
        </div>

        {/* Кнопка "экскурсия по платформе" */}
        <button
          onClick={() => navigate('/tour-video')}
          style={{
            position: 'absolute',
            top: 1860,
            left: 'calc(50% - 446px)',
            width: 892,
            height: 139,
            background: 'rgba(0,0,0,0.1)',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: 62,
            backdropFilter: 'blur(50px)',
            cursor: 'pointer',
            color: '#fff',
            fontFamily: 'Gotham Pro, Helvetica, sans-serif',
            fontWeight: 500,
            fontSize: 40,
            lineHeight: '100px',
            textAlign: 'center',
            padding: 0,
          }}
          aria-label="Экскурсия по платформе"
        >
          экскурсия по платформе
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
            background: '#000',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: 62,
            overflow: 'hidden',
            cursor: 'pointer',
            padding: 0,
            color: '#fff',
            fontFamily: 'Gotham Pro, Helvetica, sans-serif',
            fontWeight: 500,
            fontSize: 40,
            lineHeight: '100px',
            textAlign: 'center',
          }}
          aria-label="Попробовать бесплатно"
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(60% 80% at 35% 50%, rgba(55,236,247,1) 0%, rgba(55,236,247,0) 55%),' +
                'radial-gradient(60% 80% at 55% 50%, rgba(240,216,37,1) 0%, rgba(240,216,37,0) 55%),' +
                'radial-gradient(60% 80% at 70% 60%, rgba(213,252,68,1) 0%, rgba(213,252,68,0) 55%),' +
                '#000',
              filter: 'blur(0px)',
            }}
          />
          <span
            style={{
              position: 'relative',
              zIndex: 1,
            }}
          >
            попробовать бесплатно
          </span>
        </button>

        {/* Legal тексты */}
        <div
          style={{
            position: 'absolute',
            top: 2226, // 87.25% of 2550
            left: 'calc(50% - 452px)',
            width: 380,
            height: 60,
            color: '#ffffff',
            fontFamily: 'Gotham Pro, Helvetica, sans-serif',
            fontSize: 20,
            fontWeight: 300,
            lineHeight: '20px',
            textAlign: 'left',
          }}
        >
          <div style={{ margin: 0, padding: 0 }}>нажимая на кнопку, вы соглашаетесь</div>
          <div style={{ margin: 0, padding: 0, fontWeight: 700 }}>
            с политикой конфиденциальности
          </div>
          <div style={{ margin: 0, padding: 0, fontWeight: 700 }}>МЕТАФЛОРА*</div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 2226,
            left: 'calc(50% + 72px)',
            width: 395,
            height: 60,
            color: '#ffffff',
            fontFamily: 'Gotham Pro, Helvetica, sans-serif',
            fontSize: 20,
            fontWeight: 300,
            lineHeight: '20px',
            textAlign: 'right',
          }}
        >
          <div style={{ margin: 0, padding: 0 }}>нажимая на кнопку, вы соглашаетесь</div>
          <div style={{ margin: 0, padding: 0, fontWeight: 700 }}>
            на получение информационной
          </div>
          <div style={{ margin: 0, padding: 0, fontWeight: 700 }}>
            и рекламной рассылки МЕТАФЛОРА*
          </div>
        </div>

        {/* Подвал: логотип */}
        <img
          src={footerLogo}
          alt="МЕТАФЛОРА"
          style={{
            position: 'absolute',
            top: 2186,
            left: 125,
            width: 904,
            height: 195,
            objectFit: 'contain',
          }}
        />

        {/* Подвал: соцсети */}
        <div
          style={{
            position: 'absolute',
            top: 2276,
            left: 845,
            width: 230,
            height: 78,
            background: 'rgba(255,255,255,0.1)',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: 62,
            backdropFilter: 'blur(50px)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 20px',
            boxSizing: 'border-box',
          }}
        >
          <img
            src={socialsImg}
            alt="Соцсети"
            style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.8 }}
          />
        </div>
      </div>
    </div>
  );
};
