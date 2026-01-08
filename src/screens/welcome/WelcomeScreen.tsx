import React, { useState } from 'react';
import logo from '../../assets/logo.png';
import carousel1 from '../../assets/carousel-1.png';
import carousel2 from '../../assets/carousel-2.png';
import carousel3 from '../../assets/carousel-3.png';

/**
 * WelcomeScreen Component
 * 
 * Идеальная верстка по размерам из Figma (1180px baseline)
 */
export const WelcomeScreen: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const slides = [carousel1, carousel2, carousel3];

  return (
    <div className="relative flex flex-col w-full min-h-screen bg-[#020101] overflow-x-hidden font-sans select-none">
      {/* Точечный фон */}
      <div 
        className="absolute inset-0 z-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 pt-12 pb-6">
        <div className="w-[59px] h-[43px]">
          <img src={logo} alt="Лого" className="w-full h-auto object-contain" />
        </div>
        
        <button className="flex items-center justify-center w-[68px] h-[26px] bg-white/10 border-[1.3px] border-white/30 rounded-[20px] text-left px-2">
          <span className="text-[7px] leading-[8px] text-white font-light uppercase tracking-tight">
            написать<br/>в поддержку
          </span>
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col px-8">
        <h1 className="text-[32px] font-[800] text-white leading-[0.95] tracking-tighter mb-4 uppercase">
          добро пожаловать<br/>в МЕТАФЛОРУ*
        </h1>
        
        <p className="text-[13px] text-white/90 leading-[1.2] font-normal mb-8 tracking-tight">
          обучайтесь AI прямо в Telegram<br/>
          с <span className="font-black">МЕТАФЛОРОЙ*</span>: академия, лаба, цех<br/>
          и другие сервисы
        </p>

        {/* Carousel - Пропорции из макета 1180px */}
        <div className="relative flex justify-center items-center h-[340px] my-6">
          {/* Левая карта */}
          <div className="absolute left-[-50px] w-[203px] h-[324px] rounded-[13px] overflow-hidden opacity-40 rotate-[-4deg] scale-95 blur-[0.5px]">
            <img src={carousel1} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/20 to-black/60" />
          </div>

          {/* Центральная карта */}
          <div className="relative z-20 w-[177px] h-[310px] rounded-[13px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/5">
            <img src={carousel2} className="w-full h-full object-cover" />
          </div>

          {/* Правая карта */}
          <div className="absolute right-[-50px] w-[203px] h-[324px] rounded-[13px] overflow-hidden opacity-40 rotate-[4deg] scale-95 blur-[0.5px]">
            <img src={carousel3} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 to-black/60" />
          </div>
        </div>

        {/* Пагинация (Крутилка) */}
        <div className="flex justify-center items-center gap-2 mt-4 mb-10">
          <div className="w-[6px] h-[6px] rounded-full bg-[#d6d6d6]/40" />
          <div className="w-[24px] h-[6px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          <div className="w-[6px] h-[6px] rounded-full bg-[#d6d6d6]/40" />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4 mb-8">
          <button className="w-full h-[48px] border-[1.5px] border-white/30 rounded-[22px] text-white text-[14px] font-medium uppercase tracking-wider bg-white/5 active:scale-[0.98] transition-transform">
            экскурсия по платформе
          </button>
          
          <button className="relative w-full h-[48px] bg-black border-[1.5px] border-white/30 rounded-[22px] overflow-hidden active:scale-[0.98] transition-transform shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            {/* Анимированный/сложный градиентный фон */}
            <div className="absolute inset-0 opacity-90 blur-2xl">
              <div className="absolute top-[-60%] left-[-20%] w-[120%] h-[120%] bg-[#37ecf7] rounded-full opacity-60" />
              <div className="absolute top-[-40%] right-[-10%] w-[100%] h-[100%] bg-[#f0d825] rounded-full opacity-60" />
              <div className="absolute bottom-[-30%] left-[10%] w-[80%] h-[80%] bg-[#d5fc44] rounded-full opacity-60" />
            </div>
            <span className="relative z-10 text-white text-[14px] font-bold uppercase tracking-wider drop-shadow-md">
              попробовать бесплатно
            </span>
          </button>
        </div>

        {/* Legal & Footer */}
        <div className="flex justify-between items-start gap-4 mb-8">
          <p className="text-[7px] text-white/40 leading-[1.3] font-bold">
            нажимая на кнопку, вы соглашаетесь<br/>
            с <span className="underline decoration-white/20">политикой конфиденциальности<br/>МЕТАФЛОРА*</span>
          </p>
          <p className="text-[7px] text-white/40 leading-[1.3] font-bold text-right">
            нажимая на кнопку, вы соглашаетесь<br/>
            на получение <span className="underline decoration-white/20">информационной<br/>и рекламной рассылки МЕТАФЛОРА*</span>
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-5 pb-10">
          <div className="text-white text-[20px] font-black tracking-tighter uppercase">
            МЕТА<span className="italic font-light lowercase">флора</span>*
          </div>
          <div className="flex gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
             <span className="text-[12px] grayscale opacity-50">📱</span>
             <span className="text-[12px] grayscale opacity-50">📷</span>
             <span className="text-[12px] grayscale opacity-50">▶️</span>
             <span className="text-[12px] grayscale opacity-50">🎵</span>
          </div>
        </div>
      </main>
    </div>
  );
};

