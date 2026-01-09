import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import carousel1 from '../../assets/welcome/carousel-1.png';
import carousel2 from '../../assets/welcome/carousel-2.png';
import carousel3 from '../../assets/welcome/carousel-3.png';
import paginationImg from '../../assets/welcome/pagination.png';
import footerLogo from '../../assets/welcome/footer-logo.png';
import socialsImg from '../../assets/welcome/socials.png';

// Опциональный полный кадр из Figma (положи файл в assets/welcome/full-frame.png)
let fullFrameSrc: string | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  fullFrameSrc = require('../../assets/welcome/full-frame.png');
} catch (e) {
  fullFrameSrc = undefined;
}

// Размеры фрейма Figma "экран приветствия"
const DESIGN_W = 1180;
const DESIGN_H = 2550;

export const WelcomeScreen = () => {
  const navigate = useNavigate();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Масштаб строго по ширине, как в Figma (без вертикального центрирования)
  const scale = useMemo(() => vw / DESIGN_W, [vw]);

  // Для варианта с одной картинкой: масштаб по min, чтобы влезало целиком
  const fullScale = useMemo(() => Math.min(vw / DESIGN_W, vh / DESIGN_H), [vw, vh]);
  const fullOffsetX = (vw - DESIGN_W * fullScale) / 2;
  const fullOffsetY = (vh - DESIGN_H * fullScale) / 2;

  // Вспомогательная функция для позиционирования
  const pos = (x: number, y: number) => ({ left: x, top: y });

  if (fullFrameSrc) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#020101]">
        <img
          src={fullFrameSrc}
          alt="МЕТАФЛОРА"
          style={{
            position: 'absolute',
            left: fullOffsetX,
            top: fullOffsetY,
            width: DESIGN_W,
            height: DESIGN_H,
            transform: `scale(${fullScale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>
    );
  }

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-[#020101]"
    >
      {/* Фон с точками (из Figma) */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1.2px, transparent 1.2px)',
          backgroundSize: '32px 32px',
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
        <button
          onClick={() => window.open('https://t.me/mishchenko_is', '_blank')}
          className="cursor-pointer"
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
          {'обучайтесь AI прямо в Telegram \nс '}
          <span style={{ fontWeight: 800 }}>МЕТАФЛОРОЙ*</span>
          {': академия, лаба, цех \nи другие сервисы'}
        </p>

        {/* Carousel — фиксированные позиции по Figma */}
        <img
          src={carousel1}
          alt=""
          style={{
            position: 'absolute',
            ...pos(-203, 789),
            width: 609,
            height: 973,
            borderRadius: 40,
            objectFit: 'cover',
          }}
        />
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
        <img
          src={carousel3}
          alt=""
          style={{
            position: 'absolute',
            ...pos(774, 789),
            width: 609,
            height: 973,
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
        <button
          onClick={() => navigate('/tour-video')}
          style={{
            position: 'absolute',
            ...pos(128, 1899),
            width: 892,
            height: 139,
            borderRadius: 62,
            border: '4px solid rgba(255,255,255,0.30)',
            cursor: 'pointer',
            background: 'transparent',
          }}
        />
        <div
          onClick={() => navigate('/tour-video')}
          role="button"
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
            cursor: 'pointer',
            pointerEvents: 'none',
          }}
        >
          экскурсия по платформе
        </div>

        {/* Кнопка "попробовать бесплатно" с ярким градиентом (x=128 y=2057 w=892 h=139) */}
        <button
          onClick={() => navigate('/demo-access')}
          style={{
            position: 'absolute',
            ...pos(128, 2057),
            width: 892,
            height: 139,
            borderRadius: 62,
            background: 'linear-gradient(90deg, #00e8ff 0%, #00dff5 18%, #f0d825 50%, #b6ff3c 78%, #00e8ff 100%)',
            border: '5px solid rgba(255,255,255,0.35)',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          {/* Виньетка по краям для затемнения */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.6) 100%)',
              pointerEvents: 'none',
            }}
          />
        </button>
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
