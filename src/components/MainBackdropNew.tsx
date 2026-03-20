import React from 'react';
import mainBackdropNew from '../assets/shared-redesign/главная подложка новая.png';

interface MainBackdropNewProps {
  style?: React.CSSProperties;
}

export const MainBackdropNew: React.FC<MainBackdropNewProps> = ({ style }) => (
  <img
    src={mainBackdropNew}
    alt=""
    style={{
      position: 'absolute',
      left: '31px',
      top: '401px',
      width: '1162px',
      height: '1644px',
      objectFit: 'fill',
      pointerEvents: 'none',
      ...style,
    }}
  />
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
