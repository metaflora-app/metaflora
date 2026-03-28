import React from 'react';

interface HaloLayerProps {
  style?: React.CSSProperties;
  className?: string;
}

export const HaloLayer: React.FC<HaloLayerProps> = ({ style, className }) => (
  <div
    aria-hidden="true"
    className={['motion-halo-layer', className].filter(Boolean).join(' ')}
    style={style}
  />
);
