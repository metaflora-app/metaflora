import React from 'react';

interface BlurReelCardProps {
  index: number;
}

/**
 * Блюр-карточка плейсхолдер для загрузки reels
 * Показывается пока идет поиск и загрузка данных
 */
export const BlurReelCard: React.FC<BlurReelCardProps> = ({ index }) => {
  // Position: left column (0, 2, 4...) or right column (1, 3, 5...)
  const isLeftColumn = index % 2 === 0;
  const rowIndex = Math.floor(index / 2);
  
  const left = isLeftColumn ? '22px' : '444px';
  const top = `${23 + rowIndex * 805}px`;
  
  return (
    <div style={{
      position: 'absolute',
      left,
      top,
      width: '410px',
      height: '782px',
    }}>
      {/* Основной фон с блюром */}
      <div className="blur-wave" style={{
        position: 'absolute',
        inset: 0,
        backdropFilter: 'blur(50px)',
        background: 'rgba(0, 0, 0, 0.5)',
        border: '4px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '30px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }} />
      
      {/* Область изображения - блюр */}
      <div style={{
        position: 'absolute',
        top: '3.45%',
        right: '6.59%',
        bottom: '45.4%',
        left: '6.59%',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '25px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
      }} />

      {/* Кнопка play - блюр */}
      <div className="blur-wave" style={{
        position: 'absolute',
        left: 'calc(50% - 49px)',
        top: '178px',
        width: '98px',
        height: '98px',
        backdropFilter: 'blur(50px)',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '4px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '62px',
      }} />

      {/* Статистика - блюр */}
      <div className="blur-wave" style={{
        position: 'absolute',
        backdropFilter: 'blur(50px)',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        height: '52px',
        left: 'calc(50% + 0.5px)',
        borderRadius: '30px',
        top: '365px',
        transform: 'translateX(-50%)',
        width: '333px',
      }} />

      {/* Username - блюр линия */}
      <div style={{
        position: 'absolute',
        left: '9.02%',
        right: '30%',
        top: '67.26%',
        height: '40px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
      }} />

      {/* Followers - блюр линия */}
      <div style={{
        position: 'absolute',
        left: '10.24%',
        right: '40%',
        top: '74.55%',
        height: '32px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
      }} />

      {/* Кнопка анализ - блюр */}
      <div className="blur-wave" style={{
        position: 'absolute',
        bottom: '63px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '248px',
        height: '79px',
        backdropFilter: 'blur(50px)',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
      }} />

      {/* Time badge - блюр */}
      <div className="blur-wave" style={{
        position: 'absolute',
        left: 'calc(50% + 1px)',
        top: '417px',
        transform: 'translateX(-50%)',
        width: '220px',
        height: '38px',
        backdropFilter: 'blur(50px)',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '62px',
      }} />
    </div>
  );
};
