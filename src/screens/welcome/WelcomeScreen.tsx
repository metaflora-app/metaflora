import React, { useState } from 'react';
import logo from '../../assets/logo.png';
import carousel1 from '../../assets/carousel-1.png';
import carousel2 from '../../assets/carousel-2.png';
import carousel3 from '../../assets/carousel-3.png';

/**
 * WelcomeScreen Component
 * 
 * Onboarding/Welcome screen for the Telegram Mini App
 */
export const WelcomeScreen: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(1);
  
  // Carousel images from Figma
  const slides = [carousel1, carousel2, carousel3];

  return (
    <div 
      className="relative flex flex-col w-screen h-screen bg-black overflow-y-auto overflow-x-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0',
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-6 pt-14">
        <div className="w-14 h-14">
          <img src={logo} alt="Метафлора" className="w-full h-auto" />
        </div>
        
        <button className="px-5 py-2.5 text-xs text-white border border-white/30 rounded-full leading-tight">
          написать<br />в поддержку
        </button>
      </header>

      {/* Main content container */}
      <div className="flex-1 flex flex-col px-5 pb-6">
        
        {/* Welcome heading */}
        <div className="mt-4">
          <h1 className="text-[42px] font-bold text-white leading-[1.1] tracking-tight mb-3">
            добро пожаловать<br />
            в МЕТАФЛОРУ*
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            обучайтесь AI прямо в Telegram<br />
            с <span className="font-semibold">МЕТАФЛОРОЙ*</span>: академия, лэба, цех<br />
            и другие сервисы
          </p>
        </div>

        {/* Carousel with gradient backgrounds */}
        <div className="flex-1 flex items-center justify-center my-6 relative">
          <div className="relative w-full max-w-[500px] flex items-center justify-center">
            {/* Left gradient card */}
            <div 
              className="absolute left-0 w-[140px] h-[420px] rounded-[40px] z-0"
              style={{
                background: 'linear-gradient(180deg, rgba(76, 175, 80, 0.3) 0%, rgba(0, 0, 0, 0.3) 100%)',
              }}
            />
            
            {/* Center image card */}
            <div className="relative z-10 w-[240px] h-[480px] rounded-[40px] overflow-hidden bg-white/5 shadow-2xl">
              <img 
                src={slides[currentSlide]} 
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Right gradient card */}
            <div 
              className="absolute right-0 w-[140px] h-[420px] rounded-[40px] z-0"
              style={{
                background: 'linear-gradient(180deg, rgba(255, 193, 7, 0.3) 0%, rgba(255, 87, 34, 0.3) 100%)',
              }}
            />
          </div>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide 
                  ? 'w-10 bg-white' 
                  : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="space-y-3 mb-4">
          <button className="w-full py-4 px-6 text-white text-base font-medium border border-white/30 rounded-full hover:bg-white/5 transition-colors">
            экскурсия по платформе
          </button>
          
          <button 
            className="w-full py-4 px-6 text-black text-base font-semibold rounded-full transition-all"
            style={{
              background: 'linear-gradient(90deg, #4ade80 0%, #22d3ee 50%, #fbbf24 100%)',
            }}
          >
            попробовать бесплатно
          </button>
        </div>

        {/* Legal text */}
        <div className="text-center space-y-2 mb-4">
          <p className="text-white/40 text-[11px] leading-tight">
            нажимая на кнопку, вы соглашаетесь<br />
            с <span className="underline">политикой конфиденциальности<br />
            МЕТАФЛОРА*</span>
          </p>
          
          <p className="text-white/40 text-[11px] leading-tight">
            нажимая на кнопку, вы соглашаетесь<br />
            <span className="underline">на получение информационной<br />
            и рекламной рассылки МЕТАФЛОРА*</span>
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="text-white text-xl font-bold tracking-tight">
              МЕТА<span className="italic font-light">ФЛОРА</span>*
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <span className="text-white/50 text-sm">📱</span>
              <span className="text-white/50 text-sm">📷</span>
              <span className="text-white/50 text-sm">▶️</span>
              <span className="text-white/50 text-sm">🎵</span>
            </div>
          </div>
          
          <p className="text-white/30 text-[10px]">
            Copyright ©<br />
            Все права защищены.
          </p>
        </div>

        {/* Bottom safe area */}
        <div className="h-6" />
      </div>
    </div>
  );
};

