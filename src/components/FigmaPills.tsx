import React from 'react';
import downloadPlusIcon from '../assets/materials-redesign/кнопка скачать материалы.png';

interface BasePillProps {
  className?: string;
  style?: React.CSSProperties;
  textOffsetY?: number;
}

interface PillButtonProps extends BasePillProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const basePillStyle: React.CSSProperties = {
  border: '4px solid rgba(255,255,255,0.3)',
  borderRadius: '62px',
  background: 'rgba(0,0,0,0.9)',
  backdropFilter: 'blur(50px)',
  boxSizing: 'border-box',
  overflow: 'hidden',
};

export const FigmaPromptBadge: React.FC<BasePillProps> = ({ className, style, textOffsetY = 4 }) => (
  <div
    className={className}
    style={{
      ...basePillStyle,
      position: 'relative',
      width: '249.6507px',
      height: '80.9526px',
      ...style,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, calc(-50% - ${textOffsetY}px))`,
        width: '150px',
        height: '29.94px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Cygre',
        fontWeight: 700,
        fontSize: '27px',
        lineHeight: '1',
        color: 'white',
        textAlign: 'center',
      }}
    >
      промпт
    </div>
  </div>
);

export const FigmaMaterialsBadge: React.FC<BasePillProps> = ({ className, style }) => (
  <div
    className={className}
    style={{
      ...basePillStyle,
      position: 'relative',
      width: '245.7405px',
      height: '79.3512px',
      ...style,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(calc(-50% + 3px), -50%)',
        width: '167px',
        height: '29px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Gotham Pro',
        fontWeight: 500,
        fontSize: '27px',
        lineHeight: '1',
        color: 'white',
        textAlign: 'center',
      }}
    >
      материалы
    </div>
  </div>
);

export const FigmaStudyButton: React.FC<PillButtonProps> = ({ className, style, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={className}
    style={{
      ...basePillStyle,
      position: 'relative',
      width: '246.9305px',
      height: '79.25px',
      padding: 0,
      cursor: disabled ? 'default' : 'pointer',
      ...style,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: '47px',
        top: '19px',
        width: '150px',
        height: '29.3116px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Cygre',
        fontWeight: 700,
        fontSize: '27px',
        lineHeight: '1',
        color: 'white',
        textAlign: 'center',
      }}
    >
      изучить
    </div>
  </button>
);

export const FigmaReadButton: React.FC<PillButtonProps> = ({ className, style, onClick, disabled, label }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={className}
    style={{
      ...basePillStyle,
      position: 'relative',
      width: '246.9305px',
      height: '79.25px',
      padding: 0,
      cursor: disabled ? 'default' : 'pointer',
      ...style,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: '47px',
        top: '19px',
        width: '150px',
        height: '29.3116px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Cygre',
        fontWeight: 700,
        fontSize: '27px',
        lineHeight: '1',
        color: 'white',
        textAlign: 'center',
      }}
    >
      {label}
    </div>
  </button>
);

export const FigmaDownloadIconButton: React.FC<BasePillProps> = ({ className, style }) => (
  <img
    className={className}
    src={downloadPlusIcon}
    alt=""
    style={{
      width: '36px',
      height: '36px',
      objectFit: 'contain',
      display: 'block',
      flexShrink: 0,
      ...style,
    }}
  />
);
