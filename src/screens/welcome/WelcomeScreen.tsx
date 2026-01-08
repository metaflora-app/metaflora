import { useEffect, useMemo, useState } from 'react';

import logo from '../../assets/logo.png';

import carousel1 from '../../assets/welcome/carousel-1.png';
import carousel2 from '../../assets/welcome/carousel-2.png';
import carousel3 from '../../assets/welcome/carousel-3.png';

import buttonTourBg from '../../assets/welcome/button-tour.png';
import buttonTryBg from '../../assets/welcome/button-try.png';
import paginationImg from '../../assets/welcome/pagination.png';

const DESIGN_W = 1180;
const DESIGN_H = 2550;

function useViewport() {
  const get = () => {
    const w = window.visualViewport?.width ?? window.innerWidth;
    const h = window.visualViewport?.height ?? window.innerHeight;
    return { w, h };
  };

  const [vp, setVp] = useState(get);

  useEffect(() => {
    const onResize = () => setVp(get());
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return vp;
}

function pos(frameX: number, frameY: number) {
  return {
    left: frameX,
    top: frameY,
  } as const;
}

/**
 * WelcomeScreen
 * 
 * Пиксельная раскладка по Figma: рисуем в "пространстве" 1180x2550 и масштабируем под экран.
 * Важно: 1:1 по типографике будет только если подключены шрифты из Figma.
 */
export const WelcomeScreen = () => {
  const { w: vw, h: vh } = useViewport();

  // Строго как референс: макет заполняет ширину (без боковых полей).
  const scale = useMemo(() => {
    const sW = vw / DESIGN_W;
    return Math.min(1, Math.max(0.1, sW));
  }, [vw]);

  // Центрируем сцену по X через вычисляемый left, без translate (так надёжнее в iOS WebView).
  const offsetX = useMemo(() => {
    const scaledW = DESIGN_W * scale;
    return Math.round((vw - scaledW) / 2);
  }, [vw, scale]);

  // По Y: якорим сцену по НИЗУ (как на референсе). Так не будет пустого места снизу,
  // и если сцена выше окна — она сдвинется вверх ровно настолько, чтобы низ был виден.
  const offsetY = useMemo(() => {
    const scaledH = DESIGN_H * scale;
    const deltaPx = vh - scaledH; // >0: можем опустить вниз; <0: нужно поднять вверх
    return Math.round(deltaPx / scale);
  }, [vh, scale]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020101]">
      {/* dotted background (CSS, чтобы не тащить картинку) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div
        className="absolute top-0"
        style={{
          left: offsetX,
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `translateY(${offsetY}px) scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* small logo (bbox: x=505 y=187 w=177 h=128) */}
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

        {/* support button bg (bbox: x=850 y=237 w=205 h=78 radius=62 fill 10% stroke 30%) */}
        <div
          style={{
            position: 'absolute',
            ...pos(850, 237),
            width: 205,
            height: 78,
            borderRadius: 62,
            backgroundColor: 'rgba(255,255,255,0.10)',
            border: '4px solid rgba(255,255,255,0.30)',
          }}
        />

        {/* support button text (bbox: x=888 y=255 w=145 h=40 font Gotham Pro Light 20 lh20) */}
        <div
          style={{
            position: 'absolute',
            ...pos(888, 255),
            width: 145,
            height: 40,
            color: '#fff',
            fontFamily: '"Gotham Pro", system-ui, -apple-system, Segoe UI, Roboto, Arial',
            fontSize: 20,
            lineHeight: '20px',
          }}
        >
          <span style={{ fontWeight: 300 }}>написать</span>
          <br />
          <span style={{ fontWeight: 700 }}>в поддержку</span>
        </div>

        {/* title (bbox: x=94 y=337 w=938 h=160 Inter ExtraBold 80 lh80) */}
        <div
          style={{
            position: 'absolute',
            ...pos(94, 337),
            width: 938,
            height: 160,
            color: '#fff',
            whiteSpace: 'pre-line',
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial',
            fontWeight: 800,
            fontSize: 80,
            lineHeight: '80px',
          }}
        >
          {'добро пожаловать\nв МЕТАФЛОРУ*'}
        </div>

        {/* description (bbox: x=94 y=522 w=922 h=120 Gotham Pro Regular 40 lh40) */}
        <div
          style={{
            position: 'absolute',
            ...pos(94, 522),
            width: 922,
            height: 120,
            color: '#fff',
            whiteSpace: 'pre-line',
            fontFamily: '"Gotham Pro", system-ui, -apple-system, Segoe UI, Roboto, Arial',
            fontWeight: 400,
            fontSize: 40,
            lineHeight: '40px',
          }}
        >
          обучайтесь AI прямо в Telegram{'\n'}
          <span style={{ fontWeight: 700 }}>с МЕТАФЛОРОЙ*</span>: академия, лаба, цех{'\n'}
          и другие сервисы
        </div>

        {/* carousel images */}
        <div style={{ position: 'absolute', ...pos(0, 789), width: DESIGN_W, height: 980, overflow: 'hidden' }}>
          {/* left (bbox: x=-203 y=0 w=609.038 h=972.654 r=40) */}
          <img
            src={carousel1}
            alt=""
            style={{
              position: 'absolute',
              left: -203,
              top: 0,
              width: 609.038,
              height: 972.6536,
              borderRadius: 40,
              objectFit: 'cover',
            }}
          />
          {/* center (bbox: x=325 y=0 w=530 h=930 r=40) */}
          <img
            src={carousel2}
            alt=""
            style={{
              position: 'absolute',
              left: 325,
              top: 0,
              width: 530,
              height: 930,
              borderRadius: 40,
              objectFit: 'cover',
            }}
          />
          {/* right (bbox: x=775 y=0 w=609.038 h=972.654 r=40) */}
          <img
            src={carousel3}
            alt=""
            style={{
              position: 'absolute',
              left: 775,
              top: 0,
              width: 609.038,
              height: 972.6536,
              borderRadius: 40,
              objectFit: 'cover',
            }}
          />
        </div>

        {/* pagination (bbox: x=531 y=1790 w=119 h=17) */}
        <img
          src={paginationImg}
          alt=""
          style={{ position: 'absolute', ...pos(531, 1790), width: 119, height: 17 }}
        />

        {/* tour button bg (bbox: x=128 y=1899 w=892 h=139 r=62) */}
        <img
          src={buttonTourBg}
          alt=""
          style={{ position: 'absolute', ...pos(128, 1899), width: 892, height: 139 }}
        />
        {/* tour text (bbox: x=303 y=1949 w=542 h=40 Gotham Pro Medium 40 lh40 align center) */}
        <div
          style={{
            position: 'absolute',
            ...pos(303, 1949),
            width: 542,
            height: 40,
            color: '#fff',
            textAlign: 'center',
            fontFamily: '"Gotham Pro", system-ui, -apple-system, Segoe UI, Roboto, Arial',
            fontWeight: 400,
            fontSize: 40,
            lineHeight: '40px',
          }}
        >
          экскурсия по платформе
        </div>

        {/* try button bg (bbox: x=128 y=2057 w=892 h=139 r=62, fill black 90%, stroke white 30%) */}
        <img
          src={buttonTryBg}
          alt=""
          style={{ position: 'absolute', ...pos(128, 2057), width: 892, height: 139 }}
        />
        {/* try text (bbox: x=311 y=2106 w=527 h=40 Gotham Pro Medium 40 lh40 align center) */}
        <div
          style={{
            position: 'absolute',
            ...pos(311, 2106),
            width: 527,
            height: 40,
            color: '#fff',
            textAlign: 'center',
            fontFamily: '"Gotham Pro", system-ui, -apple-system, Segoe UI, Roboto, Arial',
            fontWeight: 400,
            fontSize: 40,
            lineHeight: '40px',
          }}
        >
          попробовать бесплатно
        </div>

        {/* legal left (bbox: x=137 y=2225 w=399 h=60 Milligram Macro Trial Bold 20 lh20) */}
        <div
          style={{
            position: 'absolute',
            ...pos(137, 2225),
            width: 399,
            height: 60,
            color: '#fff',
            opacity: 0.6,
            whiteSpace: 'pre-line',
            fontFamily: '"Milligram Macro Trial", system-ui, -apple-system, Segoe UI, Roboto, Arial',
            fontWeight: 700,
            fontSize: 20,
            lineHeight: '20px',
          }}
        >
          {'нажимая на кнопку, вы соглашаетесь\nс политикой конфиденциальности МЕТАФЛОРА*'}
        </div>

        {/* legal right (bbox: x=601 y=2225 w=428 h=60 Milligram Macro Trial Bold 20 lh20 align right) */}
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
            fontFamily: '"Milligram Macro Trial", system-ui, -apple-system, Segoe UI, Roboto, Arial',
            fontWeight: 700,
            fontSize: 20,
            lineHeight: '20px',
          }}
        >
          {'нажимая на кнопку, вы соглашаетесь\nна получение информационной\nи рекламной рассылки МЕТАФЛОРА*'}
        </div>

        {/* footer logo placeholder (bbox: x=125 y=2295 w=587 h=125)
            TODO: для 1:1 нужно экспортнуть из Figma узел "лого в подвале" и положить в src/assets/welcome/footer-logo.png
        */}
        <div
          style={{
            position: 'absolute',
            ...pos(125, 2295),
            width: 587,
            height: 125,
            display: 'flex',
            alignItems: 'center',
            color: '#fff',
            opacity: 0.15,
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial',
            fontWeight: 800,
            fontSize: 80,
            lineHeight: '80px',
          }}
        >
          {/* simplest placeholder until asset is provided */}
          МЕТАФЛОРА*
        </div>

        {/* copyright (bbox: x=136 y=2400 w=282 h=40 Gotham Pro Light 20 lh20) */}
        <div
          style={{
            position: 'absolute',
            ...pos(136, 2400),
            width: 282,
            height: 40,
            color: '#fff',
            opacity: 0.6,
            whiteSpace: 'pre-line',
            fontFamily: '"Gotham Pro", system-ui, -apple-system, Segoe UI, Roboto, Arial',
            fontWeight: 400,
            fontSize: 20,
            lineHeight: '20px',
          }}
        >
          {'Copyright ©\nВсе права защищены.'}
        </div>

        {/* socials bg (bbox: x=830 y=2319 w=230 h=78 r=62 fill 10% stroke 30%) */}
        <div
          style={{
            position: 'absolute',
            ...pos(830, 2319),
            width: 230,
            height: 78,
            borderRadius: 62,
            backgroundColor: 'rgba(255,255,255,0.10)',
            border: '4px solid rgba(255,255,255,0.30)',
          }}
        />
        {/* socials icons placeholder (bbox: x=847 y=2333 w=196 h=51)
            TODO: экспортнуть из Figma узел "соцсети" и положить в src/assets/welcome/socials.png
        */}
        <div
          style={{
            position: 'absolute',
            ...pos(847, 2333),
            width: 196,
            height: 51,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
            opacity: 0.35,
            fontSize: 26,
          }}
        >
          <span>✈</span>
          <span>◻</span>
          <span>▶</span>
          <span>♪</span>
        </div>

        {/* home indicator (bbox: x=384 y=2510 w=412 h=19 r=33) */}
        <div
          style={{
            position: 'absolute',
            ...pos(384, 2510),
            width: 412,
            height: 19,
            borderRadius: 33,
            backgroundColor: '#fffdfe',
          }}
        />
      </div>

      {/* Safe area pad */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 'env(safe-area-inset-bottom)' }} />
    </div>
  );
};
