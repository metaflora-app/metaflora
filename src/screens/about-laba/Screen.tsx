/**
 * о МЕТАФЛОРА* лаба (7:603)
 * About Laba Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - как устроена МЕТАФЛОРА* лаба (7:632) → main heading
 * - видео с обзором (7:634) → video player (891x1457)
 * - Frame 12343457 (7:640) → play button
 * - Frame 12343456 (7:637) → pause button
 * - Frame 12343458 (7:643) → fullscreen button
 * - Frame 12343458 (7:651) → CTA button with purple gradient
 */

import React from 'react';
import { ScreenRoot } from '../../components/layout';

export default function AboutLabaScreen() {
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

        {/* Heading (7:632) */}
        <h1 className="absolute top-[337px] left-[94px] w-[1020px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          как устроена МЕТАФЛОРА* лаба
        </h1>

        {/* Video container (7:634) */}
        <div className="absolute top-[556px] left-[144px] w-[891px] h-[1457px]">
          <div className="absolute inset-0 bg-gray-800 rounded-[40px] overflow-hidden">
            <div className="w-full h-full bg-black/50" />
          </div>
          <div className="absolute inset-0 bg-white/10 backdrop-blur rounded-[30px] border border-white/30" />

          {/* Play button (7:640) */}
          <button className="absolute top-[628px] left-[396px] w-[98px] h-[98px] bg-black/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M15 10L30 20L15 30V10Z" fill="white"/>
            </svg>
          </button>

          {/* Pause button (7:637) */}
          <button className="absolute top-[737px] left-[397px] w-[98px] h-[98px] bg-black/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="12" y="10" width="6" height="20" fill="white"/>
              <rect x="22" y="10" width="6" height="20" fill="white"/>
            </svg>
          </button>

          {/* Fullscreen button (7:643) */}
          <button className="absolute bottom-[17px] right-[14px] w-[72px] h-[72px] bg-black/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
            <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
              <path d="M8 8H16V12H12V16H8V8ZM34 8V16H30V12H26V8H34ZM8 34V26H12V30H16V34H8ZM30 34V30H26V26H34V34H30Z" fill="white"/>
            </svg>
          </button>
        </div>

        {/* CTA Button (7:651) */}
        <button className="absolute bottom-[526px] left-[148px] w-[892px] h-[139px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
          {/* Purple gradient (7:652-7:655) */}
          <div className="absolute inset-0">
            <div className="absolute top-[-150px] left-[100px] w-[576px] h-[423px] bg-[#814cf3] rounded-full blur-[100px]" />
            <div className="absolute top-[-200px] left-[250px] w-[511px] h-[310px] bg-[#d5fc44] rounded-full blur-[100px]" />
            <div className="absolute bottom-[-150px] right-[80px] w-[317px] h-[287px] bg-[#d5fc44] rounded-full blur-[100px]" />
          </div>
          <span className="relative z-10 text-white text-[40px] font-['Gotham_Pro'] font-medium">
            перейти к сервису
          </span>
        </button>

        {/* Footer (7:657) */}
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
