/**
 * все курсы в академии (7:2213)
 * Academy All Courses Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - библиотека курсов (7:2242) → main heading
 * - пройдено 10%... (7:2243) → progress text
 * - 3 course cards with completion indicators
 * - сайдбар indicators (7:2269-7:2270, 7:2284-7:2285, 7:2294-7:2295) → progress checkmarks
 * - Buttons "исследовать" with purple/lime gradient
 * - ba72c2de... (7:2240) → large background image
 */

import React from 'react';
import { ScreenRoot } from '../../components/layout';

export default function AcademyCoursesAllScreen() {
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
              <path d="M23.5 12L11.75 23.75V35.25H18.375V27-625H28.625V35.25H35.25V23.75L23.5 12Z" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <button className="absolute top-[237px] right-[120px] w-[205px] h-[78px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
          <span className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center">
            написать<br />в поддержку
          </span>
        </button>

        <div className="absolute top-[187px] left-[505px] w-[177px] h-[128px] bg-white/10 rounded-lg" />

        {/* Heading (7:2242) */}
        <h1 className="absolute top-[337px] left-[85px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          библиотека курсов
        </h1>

        {/* Progress text (7:2243) */}
        <p className="absolute top-[437px] left-[94px] w-[792px] text-white text-[40px] font-['Graphik_LCG'] font-bold leading-[40px]">
          пройдено 10% курсов академии. Сongratulations!
        </p>

        {/* COURSE CARD 1 (7:2255) */}
        <div className="absolute top-[574px] left-[129px] w-[926px] h-[249px] flex gap-[0px]">
          {/* Completion indicator - GREEN (7:2269, 7:2270) */}
          <div className="absolute left-[-29px] top-[21px] w-[38px] h-[38px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <div className="w-[16px] h-[16px] bg-[#d5fc44] rounded-[30px] border border-white/30" />
          </div>

          {/* Image (7:2256) */}
          <div className="w-[465px] h-[249px] rounded-[30px] bg-gradient-to-br from-purple-900/20 to-blue-900/20 relative">
            {/* Badge (7:2263) */}
            <div className="absolute top-[16px] right-[173px] w-[103px] h-[31px] bg-white/10 border border-white/30 rounded-[62px] flex items-center justify-center">
              <span className="text-white text-[12px] font-['Gotham_Pro'] font-bold">новый урок</span>
            </div>
            {/* Button (7:2257) */}
            <button className="absolute left-[104px] bottom-[14px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-[-30px] left-[40px] w-[125px] h-[107px] bg-[#814cf3] rounded-full blur-[40px]" />
                <div className="absolute top-[-40px] left-[60px] w-[111px] h-[79px] bg-[#d5fc44] rounded-full blur-[40px]" />
              </div>
              <span className="relative z-10 text-white text-[27px] font-['Gotham_Pro'] font-medium">исследовать</span>
            </button>
          </div>
          {/* Description (7:2265) */}
          <div className="w-[461px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
            <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
            </p>
          </div>
        </div>

        {/* COURSE CARD 2 (7:2286, 7:2287) */}
        <div className="absolute top-[896px] left-[127px] w-[926px] h-[249px] flex gap-[0px]">
          {/* Completion indicator - YELLOW (7:2292, 7:2293) */}
          <div className="absolute left-[-28px] top-[15px] w-[38px] h-[38px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <div className="w-[16px] h-[16px] bg-[#f8d050] rounded-[30px] border border-white/30" />
          </div>

          <div className="w-[465px] h-[249px] rounded-[30px] bg-pink-900/20 relative">
            <button className="absolute left-[102px] bottom-[16px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-[-30px] left-[40px] w-[125px] h-[107px] bg-[#814cf3] rounded-full blur-[40px]" />
                <div className="absolute top-[-40px] left-[60px] w-[111px] h-[79px] bg-[#d5fc44] rounded-full blur-[40px]" />
              </div>
              <span className="relative z-10 text-white text-[27px] font-['Gotham_Pro'] font-medium">исследовать</span>
            </button>
          </div>
          <div className="w-[461px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
            <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
            </p>
          </div>
        </div>

        {/* COURSE CARD 3 (7:2274) */}
        <div className="absolute top-[1217px] left-[126px] w-[928px] h-[249px] flex gap-[0px]">
          {/* Completion indicator - YELLOW (7:2284, 7:2285) */}
          <div className="absolute left-[-27px] top-[21px] w-[38px] h-[38px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <div className="w-[16px] h-[16px] bg-[#f8d050] rounded-[30px] border border-white/30" />
          </div>

          <div className="w-[467px] h-[249px] rounded-[30px] bg-blue-900/20 relative">
            <button className="absolute left-[101px] bottom-[23px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-[-30px] left-[40px] w-[125px] h-[107px] bg-[#814cf3] rounded-full blur-[40px]" />
                <div className="absolute top-[-40px] left-[60px] w-[111px] h-[79px] bg-[#d5fc44] rounded-full blur-[40px]" />
              </div>
              <span className="relative z-10 text-white text-[27px] font-['Gotham_Pro'] font-medium">исследовать</span>
            </button>
          </div>
          <div className="w-[461px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
            <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
            </p>
          </div>
        </div>

        {/* Additional card indicator (7:2294, 7:2295) */}
        <div className="absolute top-[1549px] left-[101px] w-[38px] h-[38px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
          <div className="w-[16px] h-[16px] bg-[#d5fc44] rounded-[30px] border border-white/30" />
        </div>

        {/* Card description panel (7:2271) */}
        <div className="absolute top-[1535px] left-[132px] w-[464px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
          <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
            Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
          </p>
        </div>

        {/* Card image (7:2248) */}
        <div className="absolute top-[1535px] left-[597px] w-[464px] h-[249px] rounded-[30px] bg-green-900/20 relative">
          <button className="absolute left-[101px] bottom-[29px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-[-30px] left-[40px] w-[125px] h-[107px] bg-[#814cf3] rounded-full blur-[40px]" />
              <div className="absolute top-[-40px] left-[60px] w-[111px] h-[79px] bg-[#d5fc44] rounded-full blur-[40px]" />
            </div>
            <span className="relative z-10 text-white text-[27px] font-['Gotham_Pro'] font-medium">исследовать</span>
          </button>
        </div>

        {/* Large background image (7:2240) */}
        <div className="absolute top-[1004px] left-[59px] w-[1117px] h-[1191px] bg-white/5 rounded-[40px]" />

        {/* Footer (7:2304) */}
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
