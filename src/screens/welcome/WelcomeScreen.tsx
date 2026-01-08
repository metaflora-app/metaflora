import { useMemo } from 'react';
import logo from '../../assets/logo.png';
import carousel1 from '../../assets/welcome/carousel-1.png';
import carousel2 from '../../assets/welcome/carousel-2.png';
import carousel3 from '../../assets/welcome/carousel-3.png';
import paginationImg from '../../assets/welcome/pagination.png';
import footerLogo from '../../assets/welcome/footer-logo.png';
import socialsImg from '../../assets/welcome/socials.png';

// Viewport hook
const useViewport = () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return { w, h };
};

// Размеры фрейма Figma "экран приветствия"
const DESIGN_W = 1180;
const DESIGN_H = 2550;

export const WelcomeScreen = () => {
  const { w: vw } = useViewport();

  // Масштабируем по ширине (заполняем всю ширину без отступов)
  const scale = useMemo(() => vw / DESIGN_W, [vw]);

  // Вспомогательная функция для позиционирования
  const pos = (x: number, y: number) => ({ left: x, top: y });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020101]">
      {/* Фон с точками (паттерн) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Контейнер с масштабированием */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Лого маленькое (x=505 y=187 w=177 h=128) */}
        <img
          src={logo}
          alt="Метафлора"
          style={{
            position: 'absolute',
            ...pos(505, 187),
            width: 177,
            height: 128,
            objectFit: 'contain',
          }}
        />

        {/* Кнопка "написать в поддержку" (x=824 y=237 w=205 h=78) */}
        <div
          style={{
            position: 'absolute',
            ...pos(824, 237),
            width: 205,
            height: 78,
            borderRadius: 62,
            backgroundColor: 'rgba(255,255,255,0.10)',
            border: '4px solid rgba(255,255,255,0.30)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            ...pos(862, 255),
            width: 145,
            height: 40,
            color: '#fff',
            whiteSpace: 'pre-line',
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 300,
            fontSize: 20,
            lineHeight: '20px',
          }}
        >
          {'написать \nв поддержку'}
        </div>

        {/* Заголовок "добро пожаловать в МЕТАФЛОРУ*" (x=94 y=337 w=938 h=160) */}
        <h1
          style={{
            position: 'absolute',
            ...pos(94, 337),
            width: 938,
            height: 160,
            margin: 0,
            color: '#fff',
            whiteSpace: 'pre-line',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 80,
            lineHeight: '80px',
          }}
        >
          {'добро пожаловать \nв МЕТАФЛОРУ*'}
        </h1>

        {/* Описание (x=94 y=522 w=922 h=120) */}
        <p
          style={{
            position: 'absolute',
            ...pos(94, 522),
            width: 922,
            height: 120,
            margin: 0,
            color: '#fff',
            whiteSpace: 'pre-line',
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: 40,
            lineHeight: '40px',
          }}
        >
          {'обучайтесь AI прямо в Telegram \nс МЕТАФЛОРОЙ*: академия, лаба, цех \nи другие сервисы'}
        </p>

        {/* Carousel левый (x=-203 y=789 w=530 h=930) */}
        <img
          src={carousel1}
          alt=""
          style={{
            position: 'absolute',
            ...pos(-203, 789),
            width: 530,
            height: 930,
            borderRadius: 40,
            objectFit: 'cover',
          }}
        />

        {/* Carousel центральный (x=325 y=789 w=530 h=930) */}
        <img
          src={carousel2}
          alt=""
          style={{
            position: 'absolute',
            ...pos(325, 789),
            width: 530,
            height: 930,
            borderRadius: 40,
            objectFit: 'cover',
          }}
        />

        {/* Carousel правый (x=1383 y=789 w=530 h=930) */}
        <img
          src={carousel3}
          alt=""
          style={{
            position: 'absolute',
            ...pos(1383, 789),
            width: 530,
            height: 930,
            borderRadius: 40,
            objectFit: 'cover',
          }}
        />

        {/* Pagination (x=531 y=1790 w=119 h=17) */}
        <img
          src={paginationImg}
          alt=""
          style={{
            position: 'absolute',
            ...pos(531, 1790),
            width: 119,
            height: 17,
          }}
        />

        {/* Кнопка "экскурсия по платформе" (x=128 y=1899 w=892 h=139) */}
        <div
          style={{
            position: 'absolute',
            ...pos(128, 1899),
            width: 892,
            height: 139,
            borderRadius: 62,
            border: '4px solid rgba(255,255,255,0.30)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            ...pos(303, 1949),
            width: 542,
            height: 40,
            color: '#fff',
            textAlign: 'center',
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 500,
            fontSize: 40,
            lineHeight: '40px',
          }}
        >
          экскурсия по платформе
        </div>

        {/* Кнопка "попробовать бесплатно" с градиентом (x=128 y=2057 w=892 h=139) */}
        <div
          style={{
            position: 'absolute',
            ...pos(128, 2057),
            width: 892,
            height: 139,
            borderRadius: 62,
            backgroundColor: 'rgba(0,0,0,0.90)',
            border: '4px solid rgba(255,255,255,0.30)',
            overflow: 'hidden',
          }}
        >
          {/* Градиентные круги с blur */}
          <div
            style={{
              position: 'absolute',
              left: 145 - 128,
              top: -189.57 - 2057,
              width: 575.78,
              height: 423.34,
              borderRadius: '50%',
              backgroundColor: '#37ecf7',
              filter: 'blur(80px)',
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 523.16 - 128,
              top: -203.51 - 2057,
              width: 283.01,
              height: 343.11,
              borderRadius: '50%',
              backgroundColor: '#f0d825',
              filter: 'blur(80px)',
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 403.64 - 128,
              top: 73.04 - 2057,
              width: 317.09,
              height: 286.96,
              borderRadius: '50%',
              backgroundColor: '#d5fc44',
              filter: 'blur(80px)',
              opacity: 0.6,
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            ...pos(311, 2106),
            width: 527,
            height: 40,
            color: '#fff',
            textAlign: 'center',
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 500,
            fontSize: 40,
            lineHeight: '40px',
            zIndex: 1,
          }}
        >
          попробовать бесплатно
        </div>

        {/* Legal тексты (y=2225) */}
        <div
          style={{
            position: 'absolute',
            ...pos(137, 2225),
            width: 399,
            height: 60,
            color: '#fff',
            opacity: 0.6,
            whiteSpace: 'pre-line',
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 300,
            fontSize: 20,
            lineHeight: '20px',
          }}
        >
          {'нажимая на кнопку, вы соглашаетесь \nс политикой конфиденциальности МЕТАФЛОРА*'}
        </div>
        <div
          style={{
            position: 'absolute',
            ...pos(601, 2225),
            width: 428,
            height: 60,
            color: '#fff',
            opacity: 0.6,
            whiteSpace: 'pre-line',
            textAlign: 'right',
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 300,
            fontSize: 20,
            lineHeight: '20px',
          }}
        >
          {'нажимая на кнопку, вы соглашаетесь \nна получение информационной \nи рекламной рассылки МЕТАФЛОРА*'}
        </div>

        {/* Footer logo (x=125 y=2295 w=587 h=125) */}
        <img
          src={footerLogo}
          alt=""
          style={{
            position: 'absolute',
            ...pos(125, 2295),
            width: 587,
            height: 125,
            objectFit: 'contain',
          }}
        />

        {/* Copyright (x=136 y=2400 w=282 h=40) */}
        <div
          style={{
            position: 'absolute',
            ...pos(136, 2400),
            width: 282,
            height: 40,
            color: '#fff',
            opacity: 0.6,
            whiteSpace: 'pre-line',
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 300,
            fontSize: 20,
            lineHeight: '20px',
          }}
        >
          {'Copyright ©\nВсе права защищены.'}
        </div>

        {/* Соцсети background (x=799 y=2318 w=230 h=78) */}
        <div
          style={{
            position: 'absolute',
            ...pos(799, 2318),
            width: 230,
            height: 78,
            borderRadius: 62,
            backgroundColor: 'rgba(255,255,255,0.10)',
            border: '4px solid rgba(255,255,255,0.30)',
          }}
        />
        {/* Соцсети icons (x=816 y=2332 w=196 h=51) */}
        <img
          src={socialsImg}
          alt=""
          style={{
            position: 'absolute',
            ...pos(816, 2332),
            width: 196,
            height: 51,
            objectFit: 'contain',
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
};
