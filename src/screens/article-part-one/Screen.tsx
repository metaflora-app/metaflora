/**
 * как выглядит статья (7:2090 + 7:2144 объединены)
 * Article Screen - 1180x2550px - SCROLLABLE FULL CONTENT
 * 
 * Figma→Code mapping:
 * - материалы статьи (7:2128) → main heading
 * - статья «как перенести...» (7:2129) → subtitle
 * - Frame 12343455 (7:2120) → main container (930x1636)
 * - карточка промпта (7:2121) → article card (840x1515)
 * - IMAGE 2025-12-26 07:06:48 2 (7:2125) → article header image (761x163)
 * - Adobe AI Studio (7:2124) → article section title
 * - Frame 12343457 (7:2123) → article content area (759x1262)
 * - Text content (7:2126, 7:2127) → article text
 * - IMG_4322-Photoroom 1 (7:2117) → large background image
 */

import React from 'react';
import { ScreenRoot } from '../../components/layout';

export default function ArticlePartOneScreen() {
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
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M29.375 11.75L17.625 23.5L29.375 35.25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center ml-[2px]">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M23.5 12L11.75 23.75V35.25H18.375V27.625H28.625V35.25H35.25V23.75L23.5 12Z" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <button className="absolute top-[237px] right-[120px] w-[205px] h-[78px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
          <span className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center">
            написать<br />в поддержку
          </span>
        </button>

        <div className="absolute top-[187px] left-[505px] w-[177px] h-[128px] bg-white/10 rounded-lg" />

        {/* Heading (7:2128) */}
        <h1 className="absolute top-[337px] left-[91px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          материалы статьи
        </h1>

        {/* Subtitle (7:2129) */}
        <p className="absolute top-[436px] left-[91px] w-[882px] text-white text-[40px] font-['Graphik_LC_Web'] font-medium leading-[40px]">
          статья «как перенести реальные предметы в нейрогенерацию»
        </p>

        {/* Main container (7:2120) */}
        <div className="absolute top-[601px] left-[131px] w-[930px] h-[1636px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30">
          {/* Article card (7:2121) */}
          <div className="absolute top-[57px] left-[48px] w-[840px] h-[1515px] bg-black rounded-[30px] border border-white/30 p-[41px]">
            {/* Header image (7:2125) */}
            <div className="w-[761px] h-[163px] rounded-[30px] bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-black/30 mb-[0px]" />

            {/* Content area (7:2123) */}
            <div className="w-[759px] h-[1262px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[52px] mx-auto">
              {/* First paragraph (7:2126) */}
              <p className="text-white text-[35px] font-['TT_Commons'] font-light leading-[35px] text-center mb-[78px]">
                Иногда записанный звук получается настолько плохим, что материал не хочется отдавать в монтаж. Чтобы таких проблем не возникало, можно использовать нейросети. Они автоматически найдут шумы, посторонние звуки и все, что мешает нормальной записи или разговору. И вырежут их.<br />
                Все сервисы работают примерно одинаково: загружаете аудио → нейронки находят проблемные места и вырезают их. Вот 4 классных сервиса, которые помогут обработать аудио.
              </p>

              {/* Section title (7:2124) */}
              <h2 className="text-white text-[52px] font-['Inter'] font-bold leading-[52px] text-center mb-[11px]">
                Adobe AI Studio
              </h2>

              {/* Second paragraph (7:2127) */}
              <p className="text-white text-[35px] font-['TT_Commons'] font-light leading-[35px] text-center">
                <br /><br />
                A close-up of a campfire burning intensely, flames dancing and flickering, the fire gradually fills the entire frame, warm orange glow.<br />
                А второй клип начинается с солнца, которое тоже заполняет кадр:<br />
                <br />
                A bright orange sun rising over the ocean horizon, starting as a small glowing orb that fills the frame, golden light reflecting on water.<br />
                Оба объекта оранжевые, оба занимают весь экран — нейросеть сама выстроит между ними.<br />
                <br />
                A bright orange sun rising over the ocean horizon, starting as a small glowing orb that fills the frame, golden light reflecting on water.<br />
                Оба объекта оранжевые, оба занимают весь экран — нейросеть сама выстроит между ними.
              </p>
            </div>
          </div>
        </div>

        {/* Large background image (7:2117) */}
        <div className="absolute top-[1396px] left-[21px] w-[1271px] h-[888px] bg-white/5 rounded-[40px]" />

        {/* Footer (7:2136) */}
        <footer className="absolute bottom-[44px] left-[131px] right-[131px]">
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
