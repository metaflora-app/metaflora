import React from 'react';
import backdropPeople from '../assets/shared-redesign/главная подложка фигма люди.png';
import backdropLogo from '../assets/shared-redesign/главная подложка фигма лого.png';

interface MainBackdropNewProps {
  style?: React.CSSProperties;
}

export const MainBackdropNew: React.FC<MainBackdropNewProps> = ({ style }) => (
  <div
    style={{
      position: 'absolute',
      left: '31px',
      top: '401px',
      width: '1162px',
      height: '1644px',
      pointerEvents: 'none',
      ...style,
    }}
  >
    <div style={{ position: 'absolute', left: '110px', top: '1px', width: '912px', height: '1640px', overflow: 'hidden' }}>
      <img
        src={backdropPeople}
        alt=""
        style={{
          position: 'absolute',
          height: '105.83%',
          left: '-10.74%',
          top: '-0.86%',
          width: '113.22%',
          maxWidth: 'none',
        }}
      />
    </div>

    <div style={{ position: 'absolute', left: 0, top: '88px', width: '1162px', height: '1556px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1556px', height: '1162px', transform: 'rotate(-90deg)', flex: 'none' }}>
        <div style={{ position: 'absolute', left: '191.66px', top: '133.2px', width: '1207.34px', height: '863.11px', overflow: 'hidden' }}>
          <img
            src={backdropLogo}
            alt=""
            style={{
              position: 'absolute',
              height: '252.58%',
              left: '-46.02%',
              top: '-71.61%',
              width: '188.85%',
              maxWidth: 'none',
            }}
          />
        </div>
      </div>
    </div>

    <div
      style={{
        position: 'absolute',
        left: '110px',
        top: 0,
        width: '894px',
        height: '1643px',
        backdropFilter: 'blur(50px)',
        background: 'rgba(255,255,255,0.1)',
        border: '4px solid rgba(255,255,255,0.3)',
        borderRadius: '30px',
        boxSizing: 'border-box',
      }}
    />
  </div>
);

interface SecondaryBlackBackdropProps {
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const SecondaryBlackBackdrop: React.FC<SecondaryBlackBackdropProps> = ({ style, children }) => (
  <div
    style={{
      position: 'absolute',
      left: '176px',
      top: '436px',
      width: '824px',
      height: '1573px',
      background: '#000',
      border: '4px solid rgba(255,255,255,0.3)',
      borderRadius: '30px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);
