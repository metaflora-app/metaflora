import React from 'react';

import bgBase from '../assets/figma-welcome/фон для эксперимента.png';
import bgPattern from '../assets/figma-welcome/pattern.png';
import logoSmall from '../assets/figma-welcome/logo-small.png';
import logoFooter from '../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../assets/welcome-elements/соцсети.png';

// ─── Трёхслойный фон ───────────────────────────────────────────────────────
export const ThreeBg: React.FC = () => (
  <>
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `url(${bgBase})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
    }} />
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `url(${bgPattern})`,
      backgroundSize: 'cover', backgroundRepeat: 'repeat',
      opacity: 0.6,
    }} />
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, rgba(2,1,1,0) 0%, rgba(2,1,1,0.6) 100%)',
    }} />
  </>
);

// ─── Хедер (только лого) ───────────────────────────────────────────────────
interface HeaderProps {
  onLogoClick?: () => void;
}
export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => (
  <div
    onClick={onLogoClick}
    style={{
      position: 'absolute',
      left: '500px', top: '61px',
      width: '186px', height: '131px',
      cursor: onLogoClick ? 'pointer' : 'default',
    }}
  >
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <img src={logoSmall} alt="МЕТАФЛОРА*" style={{
        position: 'absolute',
        height: '131.84%', left: '-21.84%', top: '-16.38%', width: '143.34%', maxWidth: 'none',
      }} />
    </div>
  </div>
);

// ─── Футер (лого + copyright + поддержка CSS + соцсети) ──────────────────
interface FooterProps {
  top?: number;
}
export const Footer: React.FC<FooterProps> = ({ top = 2071 }) => (
  <div style={{
    position: 'absolute',
    left: '141px',
    top: `${top}px`,
    width: '888px',
    height: '124px',
  }}>
    {/* Лого */}
    <div style={{ position: 'absolute', left: '2px', top: '-16px', width: '380px', height: '83px' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <img src={logoFooter} alt="МЕТАФЛОРА*" style={{
          position: 'absolute',
          height: '526.54%', left: '-37.89%', top: '-202.47%', width: '170.37%', maxWidth: 'none',
        }} />
      </div>
    </div>

    {/* Copyright */}
    <div style={{
      position: 'absolute', left: '2px', top: '56px',
      fontFamily: 'Cygre', fontWeight: 400, fontSize: '20px',
      color: 'rgba(255,255,255,0.6)',
    }}>
      Copyright © Все права защищены
    </div>

    {/* Кнопка "поддержка" — CSS */}
    <div style={{
      position: 'absolute',
      left: '417px', top: '-2px',
      width: '247px', height: '78px',
      backdropFilter: 'blur(50px)',
      background: 'rgba(0,0,0,0.9)',
      border: '4px solid rgba(255,255,255,0.3)',
      borderRadius: '62px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
    }}>
      <span style={{ fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', color: 'white' }}>
        поддержка
      </span>
    </div>

    {/* Соцсети — 4 иконки */}
    <div style={{
      position: 'absolute',
      left: '681px', top: '13px',
      width: '196px', height: '51px',
      overflow: 'hidden',
    }}>
      <img src={socialsIcons} alt="соцсети" style={{
        width: '100%', height: '100%', objectFit: 'contain',
      }} />
    </div>
  </div>
);
