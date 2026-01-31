import React from 'react';

/**
 * Блюр-карточка плейсхолдер для поиска аккаунта
 * Имитирует профиль Instagram с аватаркой, ником и подписчиками
 * Стиль как у BlurReelCard - с градиентным свечением
 */
export const BlurAccountCard: React.FC = () => {
  return (
    <div style={{
      position: 'absolute',
      left: '49px',
      top: '606px',
      width: '800px',
      height: '190px',
    }}>
      {/* Аватарка - круглый блюр с градиентом */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '190px',
        height: '190px',
        borderRadius: '50%',
        backdropFilter: 'blur(50px)',
        background: 'linear-gradient(135deg, rgba(100, 100, 100, 0.3) 0%, rgba(60, 60, 60, 0.2) 100%)',
        border: '3px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.1)',
      }} />

      {/* Instagram logo - блюр с градиентом */}
      <div style={{
        position: 'absolute',
        left: '255px',
        top: '7px',
        width: '64px',
        height: '78px',
        backdropFilter: 'blur(50px)',
        background: 'linear-gradient(135deg, rgba(80, 80, 80, 0.25) 0%, rgba(50, 50, 50, 0.15) 100%)',
        border: '2px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '12px',
        boxShadow: '0 4px 16px 0 rgba(255, 255, 255, 0.08)',
      }} />

      {/* Username - блюр линия с градиентом */}
      <div style={{
        position: 'absolute',
        left: '255px',
        top: '95px',
        width: '400px',
        height: '38px',
        backdropFilter: 'blur(30px)',
        background: 'linear-gradient(90deg, rgba(120, 120, 120, 0.25) 0%, rgba(80, 80, 80, 0.15) 100%)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        boxShadow: '0 4px 16px 0 rgba(255, 255, 255, 0.06)',
      }} />

      {/* Followers - блюр линия с градиентом (меньше) */}
      <div style={{
        position: 'absolute',
        left: '255px',
        top: '148px',
        width: '280px',
        height: '28px',
        backdropFilter: 'blur(30px)',
        background: 'linear-gradient(90deg, rgba(100, 100, 100, 0.2) 0%, rgba(70, 70, 70, 0.12) 100%)',
        border: '2px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px 0 rgba(255, 255, 255, 0.05)',
      }} />
    </div>
  );
};
