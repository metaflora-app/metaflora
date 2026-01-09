/**
 * первый экран промпт (7:1608)
 * Prompt First Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - IMAGE 2025-12-26 07:06:48 1 (7:1642) → header banner (930x431)
 * - Frame 12343455 (7:1643) → main container with filters & cards
 * - Frame 12343457 (7:1644) → search bar with magnifying glass icon
 * - Filter tabs → недавние, избранное, популярные, новые (active), топ-выбор
 * - 3 prompt cards (7:1708, 7:1661, 7:1677) → grid of prompt cards
 * - выход (7:1725) → home button
 * - IMG_4325-Photoroom 1 (7:1635) → large background logo
 * - хэдер и подвал (7:1729) → footer
 */


import { ScreenRoot } from '../../components/layout';

export default function PromptFirstScreen() {
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
          {/* Home button (7:1725) */}
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M23.5 12L11.75 23.75V35.25H18.375V27.625H28.625V35.25H35.25V23.75L23.5 12Z" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Support button (7:1727, 7:1728) */}
          <button className="w-[205px] h-[78px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
            <span className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center">
              написать<br />в поддержку
            </span>
          </button>
        </div>

        {/* Logo (7:1736) */}
        <div className="absolute top-[187px] left-[505px] w-[177px] h-[128px] bg-white/10 rounded-lg" />

        {/* Header banner: IMAGE 2025-12-26 07:06:48 1 (7:1642) */}
        <div className="absolute top-[341px] left-[125px] w-[930px] h-[431px] rounded-[30px] border border-white/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20 overflow-hidden">
          {/* Banner placeholder */}
        </div>

        {/* Main container: Frame 12343455 (7:1643) */}
        <div className="absolute top-[827px] left-[125px] w-[930px] h-[1434px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[42px]">
          {/* Search bar: Frame 12343457 (7:1644) */}
          <div className="w-[852px] h-[72px] border border-white/30 rounded-[62px] flex items-center px-[22px] gap-[17px] mb-[19px]">
            {/* Magnifying glass icon (7:1645) */}
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <circle cx="16" cy="16" r="12" stroke="white" strokeWidth="2"/>
              <path d="M25 25L32 32" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {/* Placeholder text (7:1646) */}
            <span className="text-[#848484] text-[23px] font-['Gotham_Pro'] font-light leading-[23px]">
              промпт для ИИ-копирайтера любых текстов
            </span>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-[0px] mb-[30px]">
            {/* недавние (7:1647, 7:1648) */}
            <button className="w-[170px] h-[47px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30">
              <span className="text-white text-[20px] font-['Gotham_Pro'] font-medium leading-[20px]">недавние</span>
            </button>

            {/* избранное (7:1649, 7:1650) */}
            <button className="w-[170px] h-[47px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 ml-[-1px]">
              <span className="text-white text-[20px] font-['Gotham_Pro'] font-medium leading-[20px]">избранное</span>
            </button>

            {/* популярные (7:1651, 7:1652) */}
            <button className="w-[170px] h-[47px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 ml-[-1px]">
              <span className="text-white text-[20px] font-['Gotham_Pro'] font-medium leading-[20px]">популярные</span>
            </button>

            {/* новые - ACTIVE (7:1653, 7:1658) */}
            <button className="w-[170px] h-[47px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 ml-[-1px] overflow-hidden">
              {/* White gradient (7:1654-7:1657) */}
              <div className="absolute inset-0">
                <div className="absolute top-[-20px] left-[20px] w-[72px] h-[89px] bg-white rounded-full blur-[30px] opacity-30" />
              </div>
              <span className="relative z-10 text-white text-[20px] font-['Gotham_Pro'] font-medium leading-[20px]">новые</span>
            </button>

            {/* топ-выбор (7:1659, 7:1660) */}
            <button className="w-[170px] h-[47px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 ml-[-1px]">
              <span className="text-white text-[20px] font-['Gotham_Pro'] font-medium leading-[20px]">топ-выбор</span>
            </button>
          </div>

          {/* Prompt cards grid - 3 cards */}
          <div className="flex gap-[39px]">
            {/* Card 1 (7:1708) */}
            <div className="w-[410px] h-[567px] bg-black rounded-[30px] border border-white/30 p-[19px] relative">
              {/* Badge: топ-выбор (7:1717, 7:1718) */}
              <div className="absolute top-[33px] right-[12px] w-[103px] h-[31px] bg-white/10 backdrop-blur border border-white/30 rounded-[62px] flex items-center justify-center">
                <span className="text-white text-[12px] font-['Gotham_Pro'] font-bold leading-[12px]">топ-выбор</span>
              </div>

              {/* Image (7:1713) */}
              <div className="w-[374px] h-[313px] rounded-[25px] bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-black/30 mb-[0px]" />

              {/* Title container (7:1710) */}
              <div className="w-[374px] h-[160px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 px-[25px] py-[30px] mb-[28px]">
                <h3 className="text-white text-[30px] font-['Gotham_Pro'] font-bold leading-[30px]">
                  ИИ-копирайтер для блога
                </h3>
              </div>

              {/* Description (7:1716) */}
              <p className="text-white text-[17px] font-['Gotham_Pro'] font-light leading-[17px] mb-[36px]">
                создайте и настройте ИИ-копирайтера за один промпт
              </p>

              {/* Button (7:1719) */}
              <button className="w-[170px] h-[47px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-[-20px] left-[20px] w-[61px] h-[89px] bg-[#37ecf7] rounded-full blur-[25px]" />
                  <div className="absolute top-[-25px] left-[25px] w-[54px] h-[65px] bg-[#f0d825] rounded-full blur-[25px]" />
                  <div className="absolute bottom-[-20px] right-[20px] w-[33px] h-[60px] bg-[#d5fc44] rounded-full blur-[25px]" />
                </div>
                <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium leading-[16px]">перейти</span>
              </button>
            </div>

            {/* Card 2 (7:1661) */}
            <div className="w-[410px] h-[567px] bg-black rounded-[30px] border border-white/30 p-[19px] relative">
              {/* Badge: новый (7:1669, 7:1670) */}
              <div className="absolute top-[33px] right-[12px] w-[103px] h-[31px] bg-white/10 backdrop-blur border border-white/30 rounded-[62px] flex items-center justify-center">
                <span className="text-white text-[12px] font-['Gotham_Pro'] font-bold leading-[12px]">новый</span>
              </div>

              {/* Image (7:1665) */}
              <div className="w-[374px] h-[313px] rounded-[25px] bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-black/30 mb-[0px]" />

              {/* Title container (7:1663) */}
              <div className="w-[374px] h-[160px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 px-[25px] py-[30px] mb-[28px]">
                <h3 className="text-white text-[30px] font-['Gotham_Pro'] font-bold leading-[30px]">
                  ИИ-копирайтер для блога
                </h3>
              </div>

              {/* Description (7:1668) */}
              <p className="text-white text-[17px] font-['Gotham_Pro'] font-light leading-[17px] mb-[36px]">
                создайте и настройте ИИ-копирайтера за один промпт
              </p>

              {/* Button (7:1671) */}
              <button className="w-[170px] h-[47px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-[-20px] left-[20px] w-[61px] h-[89px] bg-[#37ecf7] rounded-full blur-[25px]" />
                  <div className="absolute top-[-25px] left-[25px] w-[54px] h-[65px] bg-[#f0d825] rounded-full blur-[25px]" />
                  <div className="absolute bottom-[-20px] right-[20px] w-[33px] h-[60px] bg-[#d5fc44] rounded-full blur-[25px]" />
                </div>
                <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium leading-[16px]">перейти</span>
              </button>
            </div>

            {/* Card 3 (7:1677) */}
            <div className="w-[410px] h-[567px] bg-black rounded-[30px] border border-white/30 p-[19px] relative">
              {/* Image (7:1681) */}
              <div className="w-[374px] h-[313px] rounded-[25px] bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-black/30 mb-[0px]" />

              {/* Title container (7:1679) */}
              <div className="w-[374px] h-[160px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 px-[25px] py-[30px] mb-[28px]">
                <h3 className="text-white text-[30px] font-['Gotham_Pro'] font-bold leading-[30px]">
                  ИИ-копирайтер для блога
                </h3>
              </div>

              {/* Description (7:1685) */}
              <p className="text-white text-[17px] font-['Gotham_Pro'] font-light leading-[17px] mb-[36px]">
                создайте и настройте ИИ-копирайтера за один промпт
              </p>

              {/* Button (7:1686) */}
              <button className="w-[170px] h-[47px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-[-20px] left-[20px] w-[61px] h-[89px] bg-[#37ecf7] rounded-full blur-[25px]" />
                  <div className="absolute top-[-25px] left-[25px] w-[54px] h-[65px] bg-[#f0d825] rounded-full blur-[25px]" />
                  <div className="absolute bottom-[-20px] right-[20px] w-[33px] h-[60px] bg-[#d5fc44] rounded-full blur-[25px]" />
                </div>
                <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium leading-[16px]">перейти</span>
              </button>
            </div>
          </div>
        </div>

        {/* Large background logo: IMG_4325-Photoroom 1 (7:1635) */}
        <div className="absolute top-[1527px] left-[0px] w-[1198px] h-[723px] bg-white/5 rounded-[40px]" />

        {/* Footer (7:1729) */}
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
