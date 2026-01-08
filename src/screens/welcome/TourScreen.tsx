import { useMemo } from 'react';
import logo from '../../assets/logo.png';
import footerLogo from '../../assets/welcome/footer-logo.png';
import socialsImg from '../../assets/welcome/socials.png';

// Figma frame: "экран с экскурсией"
const DESIGN_W = 1180;
const DESIGN_H = 2550;

// Missing assets from Figma:
// - IMAGE 2025-12-26 06:59:59 1 (video preview)
// - IMAGE 2026-01-04 11-16-33-no-bg-preview (carve.photos) 1 (expand icon)
// - emojione-monotone:left-arrow (exit)
const videoPlaceholder =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="891" height="1457"><rect width="100%" height="100%" fill="%23000000" /><text x="50%" y="50%" fill="white" font-size="32" text-anchor="middle">video image missing</text></svg>';

export const TourScreen = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Масштаб по min, чтобы весь фрейм влез без обрезки
  const scale = useMemo(() => Math.min(vw / DESIGN_W, vh / DESIGN_H), [vw, vh]);
  const offsetX = (vw - DESIGN_W * scale) / 2;
  const offsetY = (vh - DESIGN_H * scale) / 2;
  const pos = (x: number, y: number) => ({ left: x, top: y });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020101]">
      {/* dotted background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.15) 1.2px, transparent 1.2px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div
        className="absolute"
        style={{
          left: offsetX,
          top: offsetY,
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          overflow: 'hidden',
        }}
      >
        {/* header image (x=5 y=-12 w=1180 h=148) */}
        <div
          style={{
            position: 'absolute',
            ...pos(5, -12),
            width: 1180,
            height: 148,
            background: 'rgba(0,0,0,0.2)',
          }}
        />

        {/* exit button (x=120 y=251 w=81 h=64 r=30) */}
        <div
          style={{
            position: 'absolute',
            ...pos(120, 251),
            width: 81,
            height: 64,
            borderRadius: 30,
            backgroundColor: '#ffffff',
            border: '4px solid rgba(255,255,255,0.30)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 47,
              height: 47,
              maskImage:
                'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 141 141\'%3E%3Ccircle cx=\'70.5\' cy=\'70.5\' r=\'70.5\' fill=\'%23000\'/%3E%3Cpath d=\'M88 41.8 58.5 70.5 88 99.2\' stroke=\'%23fff\' stroke-width=\'18\' stroke-linecap=\'square\' fill=\'none\'/%3E%3Cline x1=\'88\' y1=\'70.5\' x2=\'46\' y2=\'70.5\' stroke=\'%23fff\' stroke-width=\'18\' stroke-linecap=\'square\'/%3E%3C/svg%3E")',
              WebkitMaskImage:
                'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 141 141\'%3E%3Ccircle cx=\'70.5\' cy=\'70.5\' r=\'70.5\' fill=\'%23000\'/%3E%3Cpath d=\'M88 41.8 58.5 70.5 88 99.2\' stroke=\'%23fff\' stroke-width=\'18\' stroke-linecap=\'square\' fill=\'none\'/%3E%3Cline x1=\'88\' y1=\'70.5\' x2=\'46\' y2=\'70.5\' stroke=\'%23fff\' stroke-width=\'18\' stroke-linecap=\'square\'/%3E%3C/svg%3E")',
              backgroundColor: '#000',
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
            }}
          />
        </div>

        {/* support button (x=1106 y=238 w=205 h=78) */}
        <div
          style={{
            position: 'absolute',
            ...pos(1106, 238),
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
            ...pos(1144, 256),
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

        {/* top logo small (x=786 y=187 w=177 h=128) */}
        <img
          src={logo}
          alt="Метафлора"
          style={{ position: 'absolute', ...pos(786, 187), width: 177, height: 128, objectFit: 'contain' }}
        />

        {/* title (x=94? Figma shows -33830 relative: x=94 for frame?) */}
        <div
          style={{
            position: 'absolute',
            ...pos(94, 337),
            width: 1027,
            height: 160,
            color: '#fff',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 80,
            lineHeight: '80px',
          }}
        >
          экскурсия по платформе за 2 минуты
        </div>

        {/* video block (x=144 y=556 w=891 h=1457) */}
        <div
          style={{
            position: 'absolute',
            ...pos(144, 556),
            width: 891,
            height: 1457,
          }}
        >
          <img
            src={videoPlaceholder}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 40, objectFit: 'cover' }}
          />
          {/* overlay blur frame */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 30,
              backgroundColor: 'rgba(255,255,255,0.10)',
              border: '4px solid rgba(255,255,255,0.30)',
            }}
          />
          {/* shadow ellipse approx center */}
          <div
            style={{
              position: 'absolute',
              left: 393,
              top: 642,
              width: 104,
              height: 104,
              borderRadius: '50%',
              boxShadow: '0 0 0 4px rgba(0,0,0,0.6)',
            }}
          />
          {/* play button (use one) center-ish */}
          <div
            style={{
              position: 'absolute',
              left: 396,
              top: 719,
              width: 98,
              height: 98,
              borderRadius: 62,
              backgroundColor: 'rgba(0,0,0,0.10)',
              border: '4px solid rgba(255,255,255,0.30)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 36,
            }}
          >
            ►
          </div>
          {/* expand button (x ~ video right) */}
          <div
            style={{
              position: 'absolute',
              left: 821,
              top: 1368,
              width: 72,
              height: 72,
              borderRadius: 62,
              backgroundColor: 'rgba(0,0,0,0.10)',
              border: '4px solid rgba(255,255,255,0.30)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 28,
            }}
          >
            ⤢
          </div>
        </div>

        {/* home indicator (x=404? actual x=-33540-> relative 384) */}
        <div
          style={{
            position: 'absolute',
            ...pos(384, 1408),
            width: 412,
            height: 19,
            borderRadius: 33,
            backgroundColor: '#fffdfe',
          }}
        />

        {/* CTA button try (x=144 y=1068? actual: frame x=-33780 y=-11482 => relative 144) */}
        <div
          style={{
            position: 'absolute',
            ...pos(144, 1068),
            width: 891,
            height: 139,
            borderRadius: 62,
            backgroundColor: 'rgba(0,0,0,0.90)',
            border: '4px solid rgba(255,255,255,0.30)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 149 - 144,
              top: -203 - 1068,
              width: 575.78,
              height: 423.34,
              borderRadius: '50%',
              backgroundColor: '#37ecf7',
              filter: 'blur(140px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 507 - 144,
              top: -223 - 1068,
              width: 283.01,
              height: 343.11,
              borderRadius: '50%',
              backgroundColor: '#f0d825',
              filter: 'blur(140px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 388 - 144,
              top: 38 - 1068,
              width: 317.09,
              height: 286.96,
              borderRadius: '50%',
              backgroundColor: '#d5fc44',
              filter: 'blur(140px)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            ...pos(303, 1118),
            width: 527,
            height: 40,
            color: '#fff',
            textAlign: 'center',
            fontFamily: '"Gotham Pro", system-ui, sans-serif',
            fontWeight: 500,
            fontSize: 40,
            lineHeight: '40px',
          }}
        >
          попробовать бесплатно
        </div>

        {/* Legal texts (relative positions) */}
        <div
          style={{
            position: 'absolute',
            ...pos(137, 1244),
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
            ...pos(601, 1244),
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

        {/* Footer group */}
        <img
          src={footerLogo}
          alt=""
          style={{ position: 'absolute', ...pos(125, 1295), width: 587, height: 125, objectFit: 'contain' }}
        />
        <div
          style={{
            position: 'absolute',
            ...pos(136, 1400),
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
        <div
          style={{
            position: 'absolute',
            ...pos(230, 115),
            width: 177,
            height: 128,
            objectFit: 'contain',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            ...pos(799, 1313),
            width: 230,
            height: 78,
            borderRadius: 62,
            backgroundColor: 'rgba(255,255,255,0.10)',
            border: '4px solid rgba(255,255,255,0.30)',
          }}
        />
        <img
          src={socialsImg}
          alt=""
          style={{
            position: 'absolute',
            ...pos(816, 1327),
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
