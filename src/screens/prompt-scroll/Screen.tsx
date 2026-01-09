/**
 * пролистывание экран промпт (7:1738)
 * Prompt Scroll Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - Frame 12343455 (7:1769) → scrollable container with 6 prompt cards
 * - 6 prompt cards in 2 columns × 3 rows grid
 * - Each card: image + title + description + button
 * - выход (7:1865, 7:1867) → back + home buttons
 * - IMG_4325-Photoroom 1 (7:1765) → large background logo
 */

import React from 'react';
import { ScreenRoot } from '../../components/layout';

export default function PromptScrollScreen() {
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
          {/* Back button (7:1865) */}
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M29.375 11.75L17.625 23.5L29.375 35.25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Home button (7:1867) */}
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center ml-[2px]">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M23.5 12L11.75 23.75V35.25H18.375V27.625H28.625V35.25H35.25V23.75L23.5 12Z" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Support button (7:1869, 7:1870) */}
        <button className="absolute top-[237px] right-[120px] w-[205px] h-[78px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
          <span className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center">
            написать<br />в поддержку
          </span>
        </button>

        {/* Logo (7:1878) */}
        <div className="absolute top-[187px] left-[505px] w-[177px] h-[128px] bg-white/10 rounded-lg" />

        {/* Scrollable container: Frame 12343455 (7:1769) */}
        <div className="absolute top-[342px] left-[125px] w-[930px] h-[1919px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[42px]">
          
          {/* Cards grid: 2 columns × 3 rows */}
          
          {/* ROW 1 */}
          <div className="flex gap-[39px] mb-[56px]">
            {/* Card 1 (7:1848) */}
            <div className="w-[410px] h-[567px] bg-black rounded-[30px] border border-white/30 p-[19px] relative">
              {/* Badge: топ-выбор (7:1857, 7:1858) */}
              <div className="absolute top-[33px] right-[12px] w-[103px] h-[31px] bg-white/10 backdrop-blur border border-white/30 rounded-[62px] flex items-center justify-center">
                <span className="text-white text-[12px] font-['Gotham_Pro'] font-bold leading-[12px]">топ-выбор</span>
              </div>

              {/* Image (7:1853) */}
              <div className="w-[374px] h-[313px] rounded-[25px] bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-black/30 mb-[0px]" />

              {/* Title container (7:1850) */}
              <div className="w-[374px] h-[160px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 px-[25px] py-[30px] mb-[28px]">
                <h3 className="text-white text-[30px] font-['Gotham_Pro'] font-bold leading-[30px]">
                  ИИ-копирайтер для блога
                </h3>
              </div>

              {/* Description (7:1856) */}
              <p className="text-white text-[17px] font-['Gotham_Pro'] font-light leading-[17px] mb-[36px]">
                создайте и настройте ИИ-копирайтера за один промпт
              </p>

              {/* Button (7:1859) */}
              <button className="w-[170px] h-[47px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-[-20px] left-[20px] w-[61px] h-[89px] bg-[#37ecf7] rounded-full blur-[25px]" />
                  <div className="absolute top-[-25px] left-[25px] w-[54px] h-[65px] bg-[#f0d825] rounded-full blur-[25px]" />
                  <div className="absolute bottom-[-20px] right-[20px] w-[33px] h-[60px] bg-[#d5fc44] rounded-full blur-[25px]" />
                </div>
                <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium">перейти</span>
              </button>
            </div>

            {/* Card 2 (7:1770) */}
            <div className="w-[410px] h-[567px] bg-black rounded-[30px] border border-white/30 p-[19px] relative">
              {/* Badge: новый (7:1778, 7:1779) */}
              <div className="absolute top-[33px] right-[12px] w-[103px] h-[31px] bg-white/10 backdrop-blur border border-white/30 rounded-[62px] flex items-center justify-center">
                <span className="text-white text-[12px] font-['Gotham_Pro'] font-bold leading-[12px]">новый</span>
              </div>

              {/* Image (7:1774) */}
              <div className="w-[374px] h-[313px] rounded-[25px] bg-gradient-to-br from-pink-900/20 to-purple-900/20 border border-black/30 mb-[0px]" />

              {/* Title container (7:1772) */}
              <div className="w-[374px] h-[160px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 px-[25px] py-[30px] mb-[28px]">
                <h3 className="text-white text-[30px] font-['Gotham_Pro'] font-bold leading-[30px]">
                  ИИ-копирайтер для блога
                </h3>
              </div>

              {/* Description (7:1777) */}
              <p className="text-white text-[17px] font-['Gotham_Pro'] font-light leading-[17px] mb-[36px]">
                создайте и настройте ИИ-копирайтера за один промпт
              </p>

              {/* Button (7:1780) */}
              <button className="w-[170px] h-[47px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-[-20px] left-[20px] w-[61px] h-[89px] bg-[#37ecf7] rounded-full blur-[25px]" />
                  <div className="absolute top-[-25px] left-[25px] w-[54px] h-[65px] bg-[#f0d825] rounded-full blur-[25px]" />
                  <div className="absolute bottom-[-20px] right-[20px] w-[33px] h-[60px] bg-[#d5fc44] rounded-full blur-[25px]" />
                </div>
                <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium">перейти</span>
              </button>
            </div>
          </div>

          {/* ROW 2 */}
          <div className="flex gap-[39px] mb-[56px]">
            {/* Card 3 (7:1801) */}
            <div className="w-[410px] h-[567px] bg-black rounded-[30px] border border-white/30 p-[19px] relative">
              {/* Badge: популярный (7:1809, 7:1810) */}
              <div className="absolute top-[33px] right-[12px] w-[103px] h-[31px] bg-white/10 backdrop-blur border border-white/30 rounded-[62px] flex items-center justify-center">
                <span className="text-white text-[12px] font-['Gotham_Pro'] font-bold leading-[12px]">популярный</span>
              </div>

              {/* Image (7:1805) */}
              <div className="w-[374px] h-[313px] rounded-[25px] bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-black/30 mb-[0px]" />

              {/* Title container (7:1803) */}
              <div className="w-[374px] h-[160px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 px-[25px] py-[30px] mb-[28px]">
                <h3 className="text-white text-[30px] font-['Gotham_Pro'] font-bold leading-[30px]">
                  ИИ-копирайтер для блога
                </h3>
              </div>

              {/* Description (7:1808) */}
              <p className="text-white text-[17px] font-['Gotham_Pro'] font-light leading-[17px] mb-[36px]">
                создайте и настройте ИИ-копирайтера за один промпт
              </p>

              {/* Button (7:1811) */}
              <button className="w-[170px] h-[47px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-[-20px] left-[20px] w-[61px] h-[89px] bg-[#37ecf7] rounded-full blur-[25px]" />
                  <div className="absolute top-[-25px] left-[25px] w-[54px] h-[65px] bg-[#f0d825] rounded-full blur-[25px]" />
                  <div className="absolute bottom-[-20px] right-[20px] w-[33px] h-[60px] bg-[#d5fc44] rounded-full blur-[25px]" />
                </div>
                <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium">перейти</span>
              </button>
            </div>

            {/* Card 4 (7:1786) */}
            <div className="w-[410px] h-[567px] bg-black rounded-[30px] border border-white/30 p-[19px] relative">
              {/* Image (7:1790) */}
              <div className="w-[374px] h-[313px] rounded-[25px] bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-black/30 mb-[0px]" />

              {/* Title container (7:1788) */}
              <div className="w-[374px] h-[160px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 px-[25px] py-[30px] mb-[28px]">
                <h3 className="text-white text-[30px] font-['Gotham_Pro'] font-bold leading-[30px]">
                  ИИ-копирайтер для блога
                </h3>
              </div>

              {/* Description (7:1794) */}
              <p className="text-white text-[17px] font-['Gotham_Pro'] font-light leading-[17px] mb-[36px]">
                создайте и настройте ИИ-копирайтера за один промпт
              </p>

              {/* Button (7:1795) */}
              <button className="w-[170px] h-[47px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-[-20px] left-[20px] w-[61px] h-[89px] bg-[#37ecf7] rounded-full blur-[25px]" />
                  <div className="absolute top-[-25px] left-[25px] w-[54px] h-[65px] bg-[#f0d825] rounded-full blur-[25px]" />
                  <div className="absolute bottom-[-20px] right-[20px] w-[33px] h-[60px] bg-[#d5fc44] rounded-full blur-[25px]" />
                </div>
                <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium">перейти</span>
              </button>
            </div>
          </div>

          {/* ROW 3 */}
          <div className="flex gap-[39px]">
            {/* Card 5 (7:1832) */}
            <div className="w-[410px] h-[567px] bg-black rounded-[30px] border border-white/30 p-[19px] relative">
              {/* Badge: популярный (7:1840, 7:1841) */}
              <div className="absolute top-[33px] right-[12px] w-[103px] h-[31px] bg-white/10 backdrop-blur border border-white/30 rounded-[62px] flex items-center justify-center">
                <span className="text-white text-[12px] font-['Gotham_Pro'] font-bold leading-[12px]">популярный</span>
              </div>

              {/* Image (7:1836) */}
              <div className="w-[374px] h-[313px] rounded-[25px] bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-black/30 mb-[0px]" />

              {/* Title container (7:1834) */}
              <div className="w-[374px] h-[160px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 px-[25px] py-[30px] mb-[28px]">
                <h3 className="text-white text-[30px] font-['Gotham_Pro'] font-bold leading-[30px]">
                  ИИ-копирайтер для блога
                </h3>
              </div>

              {/* Description (7:1839) */}
              <p className="text-white text-[17px] font-['Gotham_Pro'] font-light leading-[17px] mb-[36px]">
                создайте и настройте ИИ-копирайтера за один промпт
              </p>

              {/* Button (7:1842) */}
              <button className="w-[170px] h-[47px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-[-20px] left-[20px] w-[61px] h-[89px] bg-[#37ecf7] rounded-full blur-[25px]" />
                  <div className="absolute top-[-25px] left-[25px] w-[54px] h-[65px] bg-[#f0d825] rounded-full blur-[25px]" />
                  <div className="absolute bottom-[-20px] right-[20px] w-[33px] h-[60px] bg-[#d5fc44] rounded-full blur-[25px]" />
                </div>
                <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium">перейти</span>
              </button>
            </div>

            {/* Card 6 (7:1817) */}
            <div className="w-[410px] h-[567px] bg-black rounded-[30px] border border-white/30 p-[19px] relative">
              {/* Image (7:1821) */}
              <div className="w-[374px] h-[313px] rounded-[25px] bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border border-black/30 mb-[0px]" />

              {/* Title container (7:1819) */}
              <div className="w-[374px] h-[160px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 px-[25px] py-[30px] mb-[28px]">
                <h3 className="text-white text-[30px] font-['Gotham_Pro'] font-bold leading-[30px]">
                  ИИ-копирайтер для блога
                </h3>
              </div>

              {/* Description (7:1825) */}
              <p className="text-white text-[17px] font-['Gotham_Pro'] font-light leading-[17px] mb-[36px]">
                создайте и настройте ИИ-копирайтера за один промпт
              </p>

              {/* Button (7:1826) */}
              <button className="w-[170px] h-[47px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-[-20px] left-[20px] w-[61px] h-[89px] bg-[#37ecf7] rounded-full blur-[25px]" />
                  <div className="absolute top-[-25px] left-[25px] w-[54px] h-[65px] bg-[#f0d825] rounded-full blur-[25px]" />
                  <div className="absolute bottom-[-20px] right-[20px] w-[33px] h-[60px] bg-[#d5fc44] rounded-full blur-[25px]" />
                </div>
                <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium">перейти</span>
              </button>
            </div>
          </div>
        </div>

        {/* Large background logo: IMG_4325-Photoroom 1 (7:1765) */}
        <div className="absolute top-[1527px] left-[0px] w-[1198px] h-[723px] bg-white/5 rounded-[40px]" />

        {/* Footer (7:1871) */}
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
