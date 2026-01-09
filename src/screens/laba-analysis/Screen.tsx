/**
 * экран анализа лаба (7:719)
 * Laba Analysis Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - ИИ-анализ контента (7:756) → main heading
 * - искусственный интеллект проанализирует... (7:800) → subtitle
 * - Frame 12343455 (7:755) → main container (930x1712)
 * - карточка промпта (7:757) → analysis card (840x1630)
 * - Profile: @mishchenko.is (7:783, 7:784, 7:785) → account info
 * - IMAGE 2025-12-26 07:06:48 2 (7:787) → post image (748x743)
 * - сайдбар с лайками (7:788) → engagement stats (227к, 40к, 2к)
 * - Frame 2131330114 (7:760) → analysis content area
 * - Frame 2131330094 (7:768, 7:774) → "следить" and "в отслеживаемых" buttons
 * - Frame 12343462 (7:802) → "начать анализ 50" button
 * - IMG_4326-Photoroom 1 (7:746) → large background image
 */

import React from 'react';
import { ScreenRoot } from '../../components/layout';

export default function LabaAnalysisScreen() {
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

        {/* Heading (7:756) */}
        <h1 className="absolute top-[337px] left-[85px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          ИИ-анализ контента
        </h1>

        {/* Subtitle (7:800) */}
        <p className="absolute top-[436px] left-[85px] w-[882px] text-white text-[40px] font-['Gotham_Pro'] font-light leading-[40px]">
          искусственный интеллект проанализирует виральность и напишет сценарий
        </p>

        {/* Main container (7:755) */}
        <div className="absolute top-[549px] left-[125px] w-[930px] h-[1712px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30">
          {/* Analysis card (7:757) */}
          <div className="absolute top-[37px] left-[48px] w-[840px] h-[1630px] bg-black rounded-[30px] border border-white/30 p-[47px]">
            {/* Profile section */}
            <div className="flex items-center gap-[14px] mb-[16px]">
              {/* Avatar (7:761) */}
              <div className="w-[157px] h-[157px] rounded-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/30" />
              
              {/* Profile info */}
              <div>
                {/* Account icon (7:783) */}
                <div className="w-[53px] h-[64px] bg-white/10 rounded-lg mb-[3px]" />
                {/* Username (7:784) */}
                <h3 className="text-white text-[32px] font-['Inter'] font-bold leading-[32px]">
                  @mishchenko.is
                </h3>
                {/* Followers (7:785) */}
                <p className="text-white text-[25px] font-['Gotham_Pro'] font-light leading-[25px]">
                  275,5к подписчиков
                </p>
              </div>

              {/* Action buttons */}
              <div className="ml-auto flex gap-[0px]">
                {/* Следить button (7:768) */}
                <button className="w-[113px] h-[40px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                  <div className="absolute inset-0">
                    <div className="absolute top-[-20px] left-[20px] w-[38px] h-[80px] bg-[#37ecf7] rounded-full blur-[25px]" />
                    <div className="absolute top-[-25px] left-[25px] w-[34px] h-[58px] bg-[#f0d825] rounded-full blur-[25px]" />
                    <div className="absolute bottom-[-20px] right-[20px] w-[21px] h-[54px] bg-[#d5fc44] rounded-full blur-[25px]" />
                  </div>
                  <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium">следить</span>
                </button>

                {/* В отслеживаемых button (7:774) */}
                <button className="w-[172px] h-[40px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden ml-[-1px]">
                  <div className="absolute inset-0">
                    <div className="absolute top-[-20px] left-[20px] w-[84px] h-[80px] bg-[#fa002d] rounded-full blur-[25px]" />
                    <div className="absolute top-[-25px] left-[30px] w-[74px] h-[58px] bg-[#f0d825] rounded-full blur-[25px]" />
                    <div className="absolute bottom-[-20px] right-[20px] w-[46px] h-[54px] bg-[#d5fc44] rounded-full blur-[25px]" />
                  </div>
                  <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium">в отслеживаемых</span>
                </button>
              </div>
            </div>

            {/* Date badge (7:796) */}
            <div className="w-[185px] h-[31px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center mb-[9px]">
              <span className="text-white text-[20px] font-['Gotham_Pro'] font-medium">2 месяца назад</span>
            </div>

            {/* Post image with engagement stats (7:786) */}
            <div className="relative w-[748px] h-[756px] mb-[49px]">
              {/* Post image (7:787) */}
              <div className="w-[748px] h-[743px] rounded-[30px] bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-black/30" />
              
              {/* Engagement bar (7:788) */}
              <div className="absolute bottom-[0px] left-[214px] w-[322px] h-[61px] bg-black backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-around px-[18px]">
                {/* Likes (7:790, 7:793) */}
                <div className="flex items-center gap-[7px]">
                  <div className="w-[51px] h-[43px] bg-white/10 rounded-lg" />
                  <span className="text-white text-[20px] font-['Gotham_Pro'] font-medium">227к</span>
                </div>
                {/* Comments (7:791, 7:794) */}
                <div className="flex items-center gap-[7px]">
                  <div className="w-[45px] h-[43px] bg-white/10 rounded-lg" />
                  <span className="text-white text-[20px] font-['Gotham_Pro'] font-medium">40к</span>
                </div>
                {/* Shares (7:792, 7:795) */}
                <div className="flex items-center gap-[7px]">
                  <div className="w-[41px] h-[40px] bg-white/10 rounded-lg" />
                  <span className="text-white text-[20px] font-['Gotham_Pro'] font-medium">2к</span>
                </div>
              </div>
            </div>

            {/* Analysis content area (7:760) */}
            <div className="w-[745px] h-[806px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[57px] relative">
              {/* описание section (7:799) */}
              <h4 className="text-white text-[32px] font-['Inter'] font-bold leading-[32px] mb-[12px]">
                описание
              </h4>
              <p className="text-white text-[25px] font-['Gotham_Pro'] font-light leading-[25px] mb-[27px]">
                а вы знали, что так вообще возможно? вам потребуется всего один советский..
              </p>

              {/* виральность section (7:764) */}
              <h4 className="text-white text-[32px] font-['Inter'] font-bold leading-[32px] mb-[12px]">
                виральность
              </h4>
              {/* Score (7:767) */}
              <p className="text-[#d5fc44] text-[25px] font-['Inter'] font-bold leading-[25px] mb-[8px]">
                7.7 баллов
              </p>
              <p className="text-white text-[25px] font-['Gotham_Pro'] font-light leading-[25px] mb-[27px]">
                а вы знали, что так вообще возможно? вам потребуется всего один советский..
              </p>

              {/* хук section (7:766) */}
              <h4 className="text-white text-[32px] font-['Inter'] font-bold leading-[32px] mb-[12px]">
                хук
              </h4>
              <p className="text-white text-[25px] font-['Gotham_Pro'] font-light leading-[25px] mb-[40px]">
                а вы знали, что так вообще возможно? вам потребуется всего один советский..
              </p>

              {/* Expand button (7:780) */}
              <button className="w-full text-center">
                <span className="text-white text-[25px] font-['Gotham_Pro'] font-medium">
                  <br />развернуть
                </span>
              </button>

              {/* Plus icon (7:781) */}
              <button className="absolute bottom-[57px] right-[314px] w-[35px] h-[35px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 0V15M0 7.5H15" stroke="white" strokeWidth="2"/>
                </svg>
              </button>
            </div>

            {/* Analysis action area (7:801) */}
            <div className="w-[666px] h-[431px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[50px] mt-[14px] mx-auto">
              {/* Analysis button (7:802) */}
              <button className="w-[294px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden mx-auto block">
                {/* White gradient (7:803-7:806) */}
                <div className="absolute inset-0">
                  <div className="absolute top-[-50px] left-[40px] w-[102px] h-[148px] bg-white rounded-full blur-[50px] opacity-30" />
                </div>
                <div className="relative z-10 flex items-center justify-center gap-[10px]">
                  <span className="text-white text-[24px] font-['Gotham_Pro'] font-medium">начать анализ</span>
                  {/* Coin icon (7:808) */}
                  <div className="w-[17px] h-[17px] bg-yellow-500/60 rounded-full" />
                  <span className="text-white text-[24px] font-['Gotham_Pro'] font-medium">50</span>
                </div>
              </button>

              {/* Notice text (7:809) */}
              <p className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center mt-[11px]">
                вы можете пополнить баланс<br />в личном кабинете
              </p>
            </div>
          </div>
        </div>

        {/* Large background image (7:746) */}
        <div className="absolute top-[993px] left-[72px] w-[1202px] h-[1365px] bg-white/5 rounded-[40px]" />

        {/* Footer (7:810) */}
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
