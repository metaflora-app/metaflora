import React from 'react';

import bgBase from '../assets/figma-welcome/фон для эксперимента.png';
import bgPattern from '../assets/figma-welcome/pattern.png';
import logoSmall from '../assets/figma-welcome/logo-small.png';
import logoFooter from '../assets/figma-welcome/logo-footer.png';
import socialSprite from '../assets/welcome-elements/socials-sprite.png';

// ─── Трёхслойный фон (точно по Figma: 1485×2660 at -153,-71) ──────────────
export const ThreeBg: React.FC = () => (
  <div style={{
    position: 'absolute',
    left: '-153px', top: '-71px',
    width: '1485px', height: '2660px',
    pointerEvents: 'none',
  }}>
    <img src={bgBase} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    <img src={bgPattern} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }} />
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(2,1,1,0) 0%, rgba(2,1,1,0.55) 100%)' }} />
  </div>
);

// ─── Хедер — только лого (x=500, y=61, w=186, h=131) ─────────────────────
interface HeaderProps { onLogoClick?: () => void; }
export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => (
  <div onClick={onLogoClick} style={{
    position: 'absolute', left: '500px', top: '61px', width: '186px', height: '131px',
    cursor: onLogoClick ? 'pointer' : 'default',
  }}>
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <img src={logoSmall} alt="МЕТАФЛОРА*" style={{
        position: 'absolute',
        height: '131.84%', left: '-21.84%', top: '-16.38%', width: '143.34%', maxWidth: 'none',
      }} />
    </div>
  </div>
);

// ─── Футер точно по Figma 2138:933 (x=141, y=2071, w=888, h=124) ──────────
// Внутри: лого(2,-16,380,83) + copyright(2,56) + соцсети(664,-2,230,78) + поддержка(417,-3,247,78)
interface FooterProps { top?: number; }
export const Footer: React.FC<FooterProps> = ({ top = 2071 }) => (
  <div style={{ position: 'absolute', left: '141px', top: `${top}px`, width: '888px', height: '124px' }}>

    {/* Лого в подвале: left=2, top=-16, w=380, h=83 */}
    <div style={{ position: 'absolute', left: '2px', top: '-16px', width: '380px', height: '83px' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <img src={logoFooter} alt="МЕТАФЛОРА*" style={{
          position: 'absolute',
          height: '526.54%', left: '-37.89%', top: '-202.47%', width: '170.37%', maxWidth: 'none',
        }} />
      </div>
    </div>

    {/* Copyright: left=2, top=56 */}
    <div style={{
      position: 'absolute', left: '2px', top: '56px',
      fontFamily: 'Cygre', fontWeight: 400, fontSize: '20px',
      color: 'rgba(255,255,255,0.6)',
    }}>
      Copyright © Все права защищены
    </div>

    {/* Подложка под соцсети: left=664, top=-2, w=230, h=78 */}
    <div style={{
      position: 'absolute', left: '664px', top: '-2px',
      width: '230px', height: '78px',
      backdropFilter: 'blur(50px)',
      background: 'black',
      border: '4px solid rgba(255,255,255,0.3)',
      borderRadius: '62px',
      overflow: 'hidden',
    }}>
      {/* Иконки внутри пилюли (right group, opacity 0.3) */}
      <div style={{ position: 'absolute', left: '111px', top: '11px', width: '94px', height: '51px', opacity: 0.5, overflow: 'hidden' }}>
        <img src={socialSprite} alt="" style={{ position: 'absolute', height: '339.84%', left: '-76.21%', top: '-118.33%', width: '277.42%', maxWidth: 'none' }} />
      </div>
    </div>

    {/* Иконки соцсетей вне пилюли: icon1 (left=681, top=13, w=50) */}
    <div style={{ position: 'absolute', left: '681px', top: '13px', width: '50px', height: '51px', overflow: 'hidden' }}>
      <img src={socialSprite} alt="" style={{ position: 'absolute', height: '339.84%', left: '-377.92%', top: '-118.33%', width: '517.92%', maxWidth: 'none' }} />
    </div>
    {/* icon2 (left=735, top=13, w=40) */}
    <div style={{ position: 'absolute', left: '735px', top: '13px', width: '40px', height: '51px', overflow: 'hidden' }}>
      <img src={socialSprite} alt="" style={{ position: 'absolute', height: '339.84%', left: '-59.08%', top: '-118.33%', width: '651.94%', maxWidth: 'none' }} />
    </div>

    {/* Кнопка поддержка: left=417, top=-3, w=247, h=78 */}
    <div style={{
      position: 'absolute', left: '417px', top: '-3px',
      width: '247px', height: '78px',
      backdropFilter: 'blur(50px)',
      background: 'black',
      border: '4px solid rgba(255,255,255,0.3)',
      borderRadius: '62px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
    }}>
      <span style={{ fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', color: 'white' }}>
        поддержка
      </span>
    </div>

  </div>
);
