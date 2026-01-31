import React from 'react';

/**
 * Блюр-карточка плейсхолдер для поиска аккаунта
 * Имитирует профиль Instagram с аватаркой, ником и подписчиками
 * Стиль как у BlurReelCard - с градиентным свечением и blur-wave анимацией
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
      {/* Аватарка - круглый блюр с градиентом и pulse анимацией */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '190px',
        height: '190px',
        borderRadius: '50%',
        backdropFilter: 'blur(50px)',
        background: 'linear-gradient(135deg, rgba(120, 120, 120, 0.4) 0%, rgba(80, 80, 80, 0.3) 100%)',
        border: '4px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.15)',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }} />

      {/* Instagram logo - блюр с градиентом и pulse анимацией */}
      <div style={{
        position: 'absolute',
        left: '255px',
        top: '7px',
        width: '64px',
        height: '78px',
        backdropFilter: 'blur(50px)',
        background: 'linear-gradient(135deg, rgba(100, 100, 100, 0.35) 0%, rgba(70, 70, 70, 0.25) 100%)',
        border: '3px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '12px',
        boxShadow: '0 4px 16px 0 rgba(255, 255, 255, 0.12)',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }} />

      {/* Username - блюр линия с градиентом и pulse анимацией (толще) */}
      <div style={{
        position: 'absolute',
        left: '255px',
        top: '95px',
        width: '420px',
        height: '44px',
        backdropFilter: 'blur(30px)',
        background: 'linear-gradient(90deg, rgba(140, 140, 140, 0.35) 0%, rgba(100, 100, 100, 0.25) 100%)',
        border: '3px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        boxShadow: '0 4px 16px 0 rgba(255, 255, 255, 0.1)',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }} />

      {/* Followers - блюр линия с градиентом и pulse анимацией (толще) */}
      <div style={{
        position: 'absolute',
        left: '255px',
        top: '152px',
        width: '300px',
        height: '36px',
        backdropFilter: 'blur(30px)',
        background: 'linear-gradient(90deg, rgba(120, 120, 120, 0.3) 0%, rgba(90, 90, 90, 0.2) 100%)',
        border: '3px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '10px',
        boxShadow: '0 4px 12px 0 rgba(255, 255, 255, 0.08)',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }} />
    </div>
  );
};
