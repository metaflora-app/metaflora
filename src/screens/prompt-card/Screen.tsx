/**
 * карточка промпта (7:1879)
 * Prompt Card Detail Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - карточка промпта (7:1936) → main heading
 * - описание (7:1937) → description subtitle
 * - Group 1597882558 (7:1934) → large prompt image (761x777)
 * - Frame 12343455 (7:1910) → main content container
 * - карточка промпта (7:1911) → prompt detail card (840x1565)
 * - Frame 12343457 (7:1914) → prompt text area with expand button
 * - Frame 12343461 (7:1917) → "промпт" tab button
 * - Rectangle 240652426 (7:1929) → "скопировать промпт" button outline
 * - Frame 12343462 (7:1923) → "вернуться к каталогу" button with gradient
 */

import React from 'react';
import { ScreenRoot } from '../../components/layout';

export default function PromptCardScreen() {
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
        <div className="absolute top-[251px] left-[120px] flex gap-[2px]">
          {/* Back button (7:1938) */}
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M29.375 11.75L17.625 23.5L29.375 35.25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Home button (7:1940) */}
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center ml-[2px]">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M23.5 12L11.75 23.75V35.25H18.375V27.625H28.625V35.25H35.25V23.75L23.5 12Z" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Support button (7:1942, 7:1943) */}
        <button className="absolute top-[237px] right-[120px] w-[205px] h-[78px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
          <span className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center">
            написать<br />в поддержку
          </span>
        </button>

        {/* Logo (7:1951) */}
        <div className="absolute top-[187px] left-[505px] w-[177px] h-[128px] bg-white/10 rounded-lg" />

        {/* Main heading: карточка промпта (7:1936) */}
        <h1 className="absolute top-[337px] left-[85px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          карточка промпта
        </h1>

        {/* Description: описание (7:1937) */}
        <p className="absolute top-[434px] left-[85px] w-[668px] text-white text-[40px] font-['Graphik_LC_Web'] font-medium leading-[40px]">
          описание: создайте и настройте копирайтера за один промпт
        </p>

        {/* Large prompt image: Group 1597882558 (7:1934) */}
        <div className="absolute top-[684px] left-[213px] w-[761px] h-[777px] rounded-[30px] bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-black/30 overflow-hidden">
          {/* Image placeholder */}
        </div>

        {/* Main content container: Frame 12343455 (7:1910) */}
        <div className="absolute top-[601px] left-[125px] w-[930px] h-[1660px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30">
          {/* Prompt card: карточка промпта (7:1911) */}
          <div className="absolute top-[50px] left-[48px] w-[840px] h-[1565px] bg-black rounded-[30px] border border-white/30 p-[43px]">
            {/* Title: ИИ-копирайтер для блога (7:1931) */}
            <h2 className="text-white text-[52px] font-['Inter'] font-bold leading-[52px] text-center mb-[66px]">
              ИИ-копирайтер для блога
            </h2>

            {/* Prompt text area: Frame 12343457 (7:1914) */}
            <div className="w-[759px] h-[486px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[33px] mb-[11px] relative">
              {/* Prompt text (7:1932) */}
              <p className="text-white text-[32px] font-['Gotham_Pro'] font-light leading-[32px] text-center mb-[0px]">
                Ты — профессиональный ИИ-копирайтер с опытом работы в маркетинге, брендинге и digital-коммуникациях.<br />
                Твоя задача — создавать осмысленные, продающие и стратегически выверенные тексты, а не просто «красивые...
              </p>

              {/* Expand button (7:1933) */}
              <button className="w-full text-center">
                <span className="text-white text-[32px] font-['Gotham_Pro'] font-medium leading-[32px]">
                  <br />развернуть
                </span>
              </button>

              {/* Plus icon button: сайдбар (7:1915) */}
              <button className="absolute bottom-[44px] right-[44px] w-[35px] h-[35px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 0V15M0 7.5H15" stroke="white" strokeWidth="2"/>
                </svg>
              </button>
            </div>

            {/* Tab button: промпт (7:1917) */}
            <button className="w-[170px] h-[47px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden mb-[45px] mx-auto block">
              {/* White gradient (7:1918-7:1921) */}
              <div className="absolute inset-0">
                <div className="absolute top-[-20px] left-[30px] w-[56px] h-[89px] bg-white rounded-full blur-[25px] opacity-30" />
              </div>
              <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium">промпт</span>
            </button>

            {/* Copy button outline: Rectangle 240652426 (7:1929, 7:1930) */}
            <button className="w-[369px] h-[95px] border border-white/30 rounded-[62px] flex items-center justify-center mb-[15px] mx-auto block">
              <span className="text-white text-[27px] font-['Gotham_Pro'] font-medium leading-[27px]">
                скопировать промпт
              </span>
            </button>

            {/* Back to catalog button: Frame 12343462 (7:1923) */}
            <button className="w-[368px] h-[95px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden mx-auto block">
              {/* Gradient (7:1924-7:1927) */}
              <div className="absolute inset-0">
                <div className="absolute top-[-60px] left-[50px] w-[153px] h-[173px] bg-[#37ecf7] rounded-full blur-[60px]" />
                <div className="absolute top-[-80px] left-[90px] w-[136px] h-[127px] bg-[#f0d825] rounded-full blur-[60px]" />
                <div className="absolute bottom-[-50px] left-[120px] w-[84px] h-[117px] bg-[#d5fc44] rounded-full blur-[60px]" />
              </div>
              <span className="relative z-10 text-white text-[27px] font-['Gotham_Pro'] font-medium leading-[27px]">
                вернуться к каталогу
              </span>
            </button>
          </div>
        </div>

        {/* Large background logo: IMG_4325-Photoroom 1 (7:1906) */}
        <div className="absolute top-[1527px] left-[0px] w-[1198px] h-[723px] bg-white/5 rounded-[40px]" />

        {/* Footer (7:1944) */}
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
