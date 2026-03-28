import React from 'react';

import bgBase from '../assets/figma-welcome/фон для эксперимента.png';
import logoSmall from '../assets/figma-welcome/logo-small.png';
import logoFooter from '../assets/figma-welcome/logo-footer.png';
import socialSprite from '../assets/welcome-elements/socials-sprite.png';

export const ThreeBg: React.FC = () => (
  <div style={{
    position: 'absolute',
    left: '-153px',
    top: '-71px',
    width: '1485px',
    height: '2660px',
    pointerEvents: 'none',
  }}>
    <img
      src={bgBase}
      alt=""
      fetchPriority="high"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
    />
  </div>
);

interface HeaderProps { onLogoClick?: () => void; }
export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => (
  <div
    onClick={onLogoClick}
    style={{
      position: 'absolute',
      left: '500px',
      top: '61px',
      width: '186px',
      height: '131px',
      cursor: onLogoClick ? 'pointer' : 'default',
    }}
  >
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <img src={logoSmall} alt="МЕТАФЛОРА*" style={{
        position: 'absolute',
        height: '131.84%',
        left: '-21.84%',
        top: '-16.38%',
        width: '143.34%',
        maxWidth: 'none',
      }} />
    </div>
  </div>
);

interface FooterProps { top?: number; }
export const Footer: React.FC<FooterProps> = ({ top = 2071 }) => (
  <div style={{ position: 'absolute', left: '141px', top: `${top}px`, width: '888px', height: '124px' }}>
    <div style={{ position: 'absolute', left: '2px', top: '-16px', width: '380px', height: '83px' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <img src={logoFooter} alt="МЕТАФЛОРА*" style={{
          position: 'absolute',
          height: '526.54%',
          left: '-37.89%',
          top: '-202.47%',
          width: '170.37%',
          maxWidth: 'none',
        }} />
      </div>
    </div>

    <div style={{
      position: 'absolute',
      left: '2px',
      top: '56px',
      fontFamily: 'Cygre',
      fontWeight: 400,
      fontSize: '20px',
      color: 'rgba(255,255,255,0.6)',
      lineHeight: '1',
    }}>
      Copyright © Все права защищены
    </div>

    <div style={{
      position: 'absolute',
      left: '664px',
      top: '-2px',
      width: '230px',
      height: '78px',
      backdropFilter: 'blur(50px)',
      background: 'black',
      border: '4px solid rgba(255,255,255,0.3)',
      borderRadius: '62px',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', left: '111px', top: '11px', width: '94px', height: '51px', opacity: 0.5, overflow: 'hidden' }}>
        <img src={socialSprite} alt="" style={{ position: 'absolute', height: '339.84%', left: '-76.21%', top: '-118.33%', width: '277.42%', maxWidth: 'none' }} />
      </div>
    </div>

    <div style={{ position: 'absolute', left: '681px', top: '13px', width: '50px', height: '51px', overflow: 'hidden' }}>
      <img src={socialSprite} alt="" style={{ position: 'absolute', height: '339.84%', left: '-377.92%', top: '-118.33%', width: '517.92%', maxWidth: 'none' }} />
    </div>
    <div style={{ position: 'absolute', left: '735px', top: '13px', width: '40px', height: '51px', overflow: 'hidden' }}>
      <img src={socialSprite} alt="" style={{ position: 'absolute', height: '339.84%', left: '-59.08%', top: '-118.33%', width: '651.94%', maxWidth: 'none' }} />
    </div>
  </div>
);
