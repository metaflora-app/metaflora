import React from 'react';
import { FIGMA_INSTAGRAM_LOGO_URL } from '../../utils/labaApi';

interface InstagramLogoMarkProps {
  style?: React.CSSProperties;
}

export const InstagramLogoMark: React.FC<InstagramLogoMarkProps> = ({ style }) => (
  <div
    style={{
      position: 'absolute',
      width: '64px',
      height: '78px',
      overflow: 'hidden',
      opacity: 0.6,
      ...style,
    }}
  >
    <img
      src={FIGMA_INSTAGRAM_LOGO_URL}
      alt=""
      style={{
        position: 'absolute',
        left: '-56.27%',
        top: '-118.33%',
        width: '620.89%',
        height: '339.84%',
        maxWidth: 'none',
        display: 'block',
      }}
    />
  </div>
);
