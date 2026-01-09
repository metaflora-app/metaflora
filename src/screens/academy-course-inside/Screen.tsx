/**
 * внутри курса в академии (7:2419)
 * Academy Course Inside Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - уроки курса "система" (7:2522) → main heading
 * - научишься всем азам... (7:2523) → subtitle
 * - Frame 2131330093 (7:2524) → lesson cards container
 * - сайдбар (7:2532) → progress indicator
 * - Frame 2131330094 (7:2538) → support button container
 */

import React from 'react';
import { ScreenRoot } from '../../components/layout';

export default function AcademyCourseInsideScreen() {
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

        {/* Heading (7:2522) */}
        <h1 className="absolute top-[337px] left-[85px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          уроки курса "система"
        </h1>

        {/* Subtitle (7:2523) */}
        <p className="absolute top-[434px] left-[85px] w-[792px] text-white text-[40px] font-['Graphik_LCG'] font-bold leading-[40px]">
          научишься всем азам работы с нейронками в 2026 году: какие выбрать и зачем
        </p>

        {/* Progress indicator (7:2532) */}
        <div className="absolute top-[595px] left-[127px] w-[38px] h-[38px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
          <div className="w-[16px] h-[16px] bg-[#d5fc44] rounded-[30px] border border-white/30" />
        </div>

        {/* Lesson cards container - placeholder for actual lesson list */}
        <div className="absolute top-[581px] left-[177px] w-[878px] space-y-[40px]">
          {/* Sample lesson cards */}
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="w-full h-[249px] flex gap-[16px]">
              <div className="w-[465px] h-[249px] rounded-[30px] bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
              <div className="w-[397px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
                <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
                  Курс «Система» — про то, как выстраивать процессы, а не тушить пожары.
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
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
