/**
 * все статьи в полигоне (7:2312)
 * Poligon All Articles Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - статьи в полигоне (7:2341) → main heading
 * - Frame 12343457 (7:2408) → search bar (932x72)
 * - Filter tabs (7:2394-7:2407) → вернуть, система, искусство, промптинг, автоматизация
 * - 3 article cards with "читать" buttons (cyan/yellow/lime gradient)
 * - IMG_4322-Photoroom 1 (7:2339) → large background image
 */

import React from 'react';
import { ScreenRoot } from '../../components/layout';

export default function PoligonArticlesAllScreen() {
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

        {/* Heading (7:2341) */}
        <h1 className="absolute top-[338px] left-[91px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          статьи в полигоне
        </h1>

        {/* Search bar (7:2408) */}
        <div className="absolute top-[436px] left-[132px] w-[932px] h-[72px] border border-white/30 rounded-[62px] flex items-center px-[22px] gap-[16px]">
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <circle cx="16" cy="16" r="12" stroke="white" strokeWidth="2"/>
            <path d="M25 25L32 32" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-[#848484] text-[23px] font-['Gotham_Pro'] font-light">
            найти по ключевым словам
          </span>
        </div>

        {/* Filter tabs */}
        <div className="absolute top-[543px] left-[93px] flex gap-[3px]">
          {/* вернуть (7:2394) */}
          <button className="w-[170px] h-[47px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-[-20px] left-[28px] w-[61px] h-[89px] bg-white rounded-full blur-[25px] opacity-30" />
            </div>
            <span className="relative z-10 text-white text-[20px] font-['Gotham_Pro'] font-medium">вернуть</span>
          </button>

          {/* система (7:2400) */}
          <button className="w-[170px] h-[47px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30">
            <span className="text-white text-[20px] font-['Gotham_Pro'] font-medium">система</span>
          </button>

          {/* искусство (7:2402) */}
          <button className="w-[170px] h-[47px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30">
            <span className="text-white text-[20px] font-['Gotham_Pro'] font-medium">искусство</span>
          </button>

          {/* промптинг (7:2404) */}
          <button className="w-[170px] h-[47px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30">
            <span className="text-white text-[20px] font-['Gotham_Pro'] font-medium">промптинг</span>
          </button>

          {/* автоматизация (7:2406) */}
          <button className="w-[170px] h-[47px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30">
            <span className="text-white text-[20px] font-['Gotham_Pro'] font-medium">автоматизация</span>
          </button>
        </div>

        {/* Article cards */}
        
        {/* Card 1 (7:2353) */}
        <div className="absolute top-[625px] left-[135px] w-[926px] h-[249px] flex gap-[0px]">
          <div className="w-[465px] h-[249px] rounded-[30px] bg-gradient-to-br from-purple-900/20 to-blue-900/20 relative">
            {/* Badge (7:2355) */}
            <div className="absolute top-[16px] right-[173px] w-[103px] h-[31px] bg-white/10 border border-white/30 rounded-[62px] flex items-center justify-center">
              <span className="text-white text-[12px] font-['Gotham_Pro'] font-bold">новая статья</span>
            </div>
            {/* Button (7:2357) */}
            <button className="absolute left-[104px] bottom-[14px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-[-30px] left-[40px] w-[144px] h-[123px] bg-[#37ecf7] rounded-full blur-[40px]" />
                <div className="absolute top-[-40px] left-[60px] w-[128px] h-[90px] bg-[#f0d825] rounded-full blur-[40px]" />
                <div className="absolute bottom-[-30px] right-[40px] w-[79px] h-[83px] bg-[#d5fc44] rounded-full blur-[40px]" />
              </div>
              <span className="relative z-10 text-white text-[27px] font-['Gotham_Pro'] font-medium">читать</span>
            </button>
          </div>
          <div className="w-[461px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
            <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
            </p>
          </div>
        </div>

        {/* Card 2 (7:2380, 7:2387) */}
        <div className="absolute top-[947px] left-[133px] w-[926px] h-[249px] flex gap-[0px]">
          <div className="w-[465px] h-[249px] rounded-[30px] bg-pink-900/20 relative">
            <button className="absolute left-[104px] bottom-[26px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-[-30px] left-[40px] w-[144px] h-[123px] bg-[#37ecf7] rounded-full blur-[40px]" />
                <div className="absolute top-[-40px] left-[60px] w-[128px] h-[90px] bg-[#f0d825] rounded-full blur-[40px]" />
                <div className="absolute bottom-[-30px] right-[40px] w-[79px] h-[83px] bg-[#d5fc44] rounded-full blur-[40px]" />
              </div>
              <span className="relative z-10 text-white text-[27px] font-['Gotham_Pro'] font-medium">читать</span>
            </button>
          </div>
          <div className="w-[461px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
            <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
            </p>
          </div>
        </div>

        {/* Card 3 (7:2370) */}
        <div className="absolute top-[1268px] left-[132px] w-[928px] h-[249px] flex gap-[0px]">
          <div className="w-[467px] h-[249px] rounded-[30px] bg-blue-900/20 relative">
            <button className="absolute left-[101px] bottom-[30px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-[-30px] left-[40px] w-[144px] h-[123px] bg-[#37ecf7] rounded-full blur-[40px]" />
                <div className="absolute top-[-40px] left-[60px] w-[128px] h-[90px] bg-[#f0d825] rounded-full blur-[40px]" />
                <div className="absolute bottom-[-30px] right-[40px] w-[79px] h-[83px] bg-[#d5fc44] rounded-full blur-[40px]" />
              </div>
              <span className="relative z-10 text-white text-[27px] font-['Gotham_Pro'] font-medium">читать</span>
            </button>
          </div>
          <div className="w-[461px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
            <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
            </p>
          </div>
        </div>

        {/* Card 4 placeholder (7:2346, 7:2367) */}
        <div className="absolute top-[1586px] left-[135px] w-[926px] h-[249px] flex gap-[0px]">
          <div className="w-[464px] h-[249px] rounded-[30px] bg-green-900/20 relative">
            <button className="absolute left-[104px] bottom-[40px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-[-30px] left-[40px] w-[144px] h-[123px] bg-[#37ecf7] rounded-full blur-[40px]" />
                <div className="absolute top-[-40px] left-[60px] w-[128px] h-[90px] bg-[#f0d825] rounded-full blur-[40px]" />
                <div className="absolute bottom-[-30px] right-[40px] w-[79px] h-[83px] bg-[#d5fc44] rounded-full blur-[40px]" />
              </div>
              <span className="relative z-10 text-white text-[27px] font-['Gotham_Pro'] font-medium">читать</span>
            </button>
          </div>
          <div className="w-[464px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
            <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
            </p>
          </div>
        </div>

        {/* Large background image (7:2339) */}
        <div className="absolute top-[1396px] left-[21px] w-[1271px] h-[888px] bg-white/5 rounded-[40px]" />

        {/* Footer (7:2411) */}
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
