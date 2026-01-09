/**
 * экран метакоины (7:2652)
 * Metacoins Purchase Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - выберите количество метакоинов (7:2695) → main heading
 * - карточка тарифа 5000 (7:2696) → 5000 metacoins package
 * - карточка тарифа 25000 (7:2681) → 25000 metacoins package
 * - Frame 12343458 (7:2711) → CTA button "купить метакоины"
 */

import React from 'react';
import { ScreenRoot } from '../../components/layout';

export default function MetacoinsScreen() {
  return (
    <ScreenRoot className="bg-[#020101] relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 w-full h-full opacity-10">
        <div className="grid grid-cols-4 gap-0 w-full h-full">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-full h-full bg-black opacity-5" />
          ))}
        </div>
      </div>

      <div className="relative w-[1180px] h-[2550px] mx-auto">
        {/* Top navigation */}
        <div className="absolute top-[251px] left-[120px] right-[120px] flex justify-between items-center">
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M29.375 11.75L17.625 23.5L29.375 35.25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="w-[205px] h-[78px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
            <span className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center">
              написать<br />в поддержку
            </span>
          </button>
        </div>

        {/* Logo */}
        <div className="absolute top-[187px] left-[505px] w-[177px] h-[128px] bg-white/10 rounded-lg" />

        {/* Heading (7:2695) */}
        <h1 className="absolute top-[337px] left-[90px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          выберите количество<br />метакоинов
        </h1>

        {/* Package 1: 5000 metacoins (7:2696) */}
        <div className="absolute top-[557px] left-[131px] w-[930px] h-[603px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[60px]">
          {/* Background image (7:2704) */}
          <div className="absolute inset-0 rounded-[30px] bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
          
          {/* Icon (7:2706) */}
          <div className="absolute top-[52px] left-[223px] w-[60px] h-[60px] rounded-full bg-yellow-500/30 border border-white/30" />

          {/* Title (7:2705) */}
          <h2 className="relative z-10 text-white text-[80px] font-['Inter'] font-extrabold leading-[80px] mb-[5px]">
            5000<br />метакоинов
          </h2>

          {/* Features (7:2707) */}
          <div className="relative z-10 text-white text-[40px] font-['Graphik_LC_Web'] font-medium leading-[40px]">
            <p>200+ ИИ-анализа контента</p>
            <p>130+ генераций сценариев</p>
            <p>50+ поисковых запросов по ключам</p>
            <p>20 отслеживаемых аккаунтов</p>
            <p>а также: доступ к новым функциям сервиса,</p>
            <p>эксклюзивы и бонусы каждый месяц</p>
          </div>

          {/* Price button (7:2698) */}
          <button className="absolute top-[57px] right-[18px] w-[176px] h-[57px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-[-30px] left-[15px] w-[53px] h-[148px] bg-white rounded-full blur-[40px] opacity-30" />
            </div>
            <span className="relative z-10 text-white text-[23px] font-['Gotham_Pro'] font-medium">
              3990 руб.
            </span>
          </button>
        </div>

        {/* Package 2: 25000 metacoins (7:2681) */}
        <div className="absolute top-[1221px] left-[131px] w-[930px] h-[603px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[60px]">
          {/* Background image (7:2680) */}
          <div className="absolute inset-0 rounded-[30px] bg-gradient-to-br from-pink-900/20 to-purple-900/20" />
          
          {/* Icon (7:2692) */}
          <div className="absolute top-[52px] left-[277px] w-[60px] h-[60px] rounded-full bg-orange-500/30 border border-white/30" />

          {/* Title (7:2684) */}
          <h2 className="relative z-10 text-white text-[80px] font-['Inter'] font-extrabold leading-[80px] mb-[5px]">
            25000<br />метакоинов
          </h2>

          {/* Features (7:2685) */}
          <div className="relative z-10 text-white text-[40px] font-['Graphik_LC_Web'] font-medium leading-[40px]">
            <p>500+ ИИ-анализа контента</p>
            <p>250+ генераций сценариев</p>
            <p>200+ поисковых запросов по ключам</p>
            <p>100 отслеживаемых аккаунтов</p>
            <p>а также: доступ к новым функциям сервиса,</p>
            <p>эксклюзивы и бонусы каждый месяц</p>
          </div>

          {/* Price button (7:2686) */}
          <button className="absolute top-[57px] right-[18px] w-[176px] h-[57px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-[-30px] left-[20px] w-[51px] h-[148px] bg-white rounded-full blur-[40px] opacity-30" />
            </div>
            <span className="relative z-10 text-white text-[23px] font-['Gotham_Pro'] font-medium">
              14490 руб.
            </span>
          </button>
        </div>

        {/* CTA Button (7:2711) */}
        <button className="absolute bottom-[686px] left-[149px] w-[892px] h-[139px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-[-150px] left-[100px] w-[576px] h-[423px] bg-[#fa002d] rounded-full blur-[100px]" />
            <div className="absolute top-[-200px] left-[250px] w-[511px] h-[310px] bg-[#f0d825] rounded-full blur-[100px]" />
            <div className="absolute bottom-[-150px] right-[80px] w-[317px] h-[287px] bg-[#d5fc44] rounded-full blur-[100px]" />
          </div>
          <span className="relative z-10 text-white text-[40px] font-['Gotham_Pro'] font-medium">
            купить метакоины
          </span>
        </button>

        {/* Footer (7:2719) */}
        <footer className="absolute bottom-[44px] left-[125px] right-[125px]">
          <div className="mb-[20px]">
            <div className="w-[587px] h-[125px] bg-white/10 rounded-lg" />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px]">
              Copyright ©<br />Все права защищены.
            </p>
            <div className="flex items-center gap-[10px] px-[17px] py-[13px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30">
              <div className="w-[50px] h-[51px] bg-white/20 rounded-full" />
              <div className="w-[142px] h-[51px] bg-white/20 rounded-lg" />
            </div>
          </div>
        </footer>
      </div>
    </ScreenRoot>
  );
}
