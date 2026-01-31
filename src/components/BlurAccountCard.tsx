import React from 'react';

/**
 * Блюр-карточка плейсхолдер для поиска аккаунта
 * Имитирует профиль Instagram с аватаркой, ником и подписчиками
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
      {/* Аватарка - круглый блюр */}
      <div className="blur-wave" style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '190px',
        height: '190px',
        borderRadius: '50%',
        backdropFilter: 'blur(50px)',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '4px solid rgba(255, 255, 255, 0.2)',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }} />

      {/* Instagram logo - блюр */}
      <div className="blur-wave" style={{
        position: 'absolute',
        left: '255px',
        top: '7px',
        width: '64px',
        height: '78px',
        backdropFilter: 'blur(50px)',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }} />

      {/* Username - блюр линия */}
      <div className="blur-wave" style={{
        position: 'absolute',
        left: '255px',
        top: '85px',
        width: '400px',
        height: '42px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }} />

      {/* Followers - блюр линия (меньше) */}
      <div className="blur-wave" style={{
        position: 'absolute',
        left: '255px',
        top: '142px',
        width: '300px',
        height: '32px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }} />
    </div>
  );
};
