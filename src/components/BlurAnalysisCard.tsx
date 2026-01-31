import React from 'react';

/**
 * Блюр-карточка плейсхолдер для анализа контента
 * Показывается пока идет генерация анализа
 * Имитирует структуру: виральность, хук, транскрибация, суть видео
 */
export const BlurAnalysisCard: React.FC = () => {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '30px',
      paddingTop: '20px',
    }}>
      {/* Виральность - заголовок + текст */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="blur-wave" style={{
          width: '200px',
          height: '36px',
          backdropFilter: 'blur(30px)',
          background: 'linear-gradient(90deg, rgba(140, 140, 140, 0.35) 0%, rgba(100, 100, 100, 0.25) 100%)',
          border: '3px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          boxShadow: '0 4px 16px 0 rgba(255, 255, 255, 0.1)',
        }} />
        <div className="blur-wave" style={{
          width: '100%',
          height: '80px',
          backdropFilter: 'blur(30px)',
          background: 'linear-gradient(90deg, rgba(120, 120, 120, 0.3) 0%, rgba(90, 90, 90, 0.2) 100%)',
          border: '3px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px 0 rgba(255, 255, 255, 0.08)',
        }} />
      </div>

      {/* Хук - заголовок + текст */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="blur-wave" style={{
          width: '120px',
          height: '36px',
          backdropFilter: 'blur(30px)',
          background: 'linear-gradient(90deg, rgba(140, 140, 140, 0.35) 0%, rgba(100, 100, 100, 0.25) 100%)',
          border: '3px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          boxShadow: '0 4px 16px 0 rgba(255, 255, 255, 0.1)',
        }} />
        <div className="blur-wave" style={{
          width: '100%',
          height: '80px',
          backdropFilter: 'blur(30px)',
          background: 'linear-gradient(90deg, rgba(120, 120, 120, 0.3) 0%, rgba(90, 90, 90, 0.2) 100%)',
          border: '3px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px 0 rgba(255, 255, 255, 0.08)',
        }} />
      </div>

      {/* Транскрибация - заголовок + текст */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="blur-wave" style={{
          width: '240px',
          height: '36px',
          backdropFilter: 'blur(30px)',
          background: 'linear-gradient(90deg, rgba(140, 140, 140, 0.35) 0%, rgba(100, 100, 100, 0.25) 100%)',
          border: '3px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          boxShadow: '0 4px 16px 0 rgba(255, 255, 255, 0.1)',
        }} />
        <div className="blur-wave" style={{
          width: '100%',
          height: '120px',
          backdropFilter: 'blur(30px)',
          background: 'linear-gradient(90deg, rgba(120, 120, 120, 0.3) 0%, rgba(90, 90, 90, 0.2) 100%)',
          border: '3px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px 0 rgba(255, 255, 255, 0.08)',
        }} />
      </div>

      {/* Суть видео - заголовок + текст */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="blur-wave" style={{
          width: '180px',
          height: '36px',
          backdropFilter: 'blur(30px)',
          background: 'linear-gradient(90deg, rgba(140, 140, 140, 0.35) 0%, rgba(100, 100, 100, 0.25) 100%)',
          border: '3px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          boxShadow: '0 4px 16px 0 rgba(255, 255, 255, 0.1)',
        }} />
        <div className="blur-wave" style={{
          width: '100%',
          height: '100px',
          backdropFilter: 'blur(30px)',
          background: 'linear-gradient(90deg, rgba(120, 120, 120, 0.3) 0%, rgba(90, 90, 90, 0.2) 100%)',
          border: '3px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px 0 rgba(255, 255, 255, 0.08)',
        }} />
      </div>
    </div>
  );
};
