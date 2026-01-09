/**
 * экран с экскурсией (7:99)
 * Tour Video Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - фон точки (7:100) → background pattern
 * - экскурсия по платформе за 2 минуты (7:129) → heading
 * - видео с обзором (7:131) → video player container
 * - кнопки управления видео → play/pause/fullscreen controls
 * - выход (7:144) → back button
 * - кнопка попробовать бесплатно (7:146) → CTA button with gradient
 * - хэдер и подвал (7:154) → header/footer components
 */


import { ScreenRoot } from '../../components/layout';

export default function TourVideoScreen() {
  return (
    <ScreenRoot className="bg-[#020101] relative overflow-hidden">
      {/* Background pattern: фон точки (7:100) */}
      <div className="absolute inset-0 w-full h-full">
        {/* Repeating dot pattern background - placeholder for IMG_3904 images */}
        <div className="w-full h-full opacity-10">
          {/* Background images grid - using div placeholders for now */}
          <div className="grid grid-cols-4 gap-0 w-full h-full">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-full h-full bg-black opacity-5" />
            ))}
          </div>
        </div>
      </div>

      {/* Main content container */}
      <div className="relative w-[1180px] h-[2550px] mx-auto">
        {/* Top navigation bar */}
        <div className="absolute top-[251px] left-[120px] right-[120px] flex justify-between items-center">
          {/* Back button: выход (7:144) */}
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M29.375 11.75L17.625 23.5L29.375 35.25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Support button: написать в поддержку (7:152, 7:153) */}
          <button className="w-[205px] h-[78px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
            <span className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center">
              написать<br />в поддержку
            </span>
          </button>
        </div>

        {/* Logo: лого-Photoroom 1 (7:161) */}
        <div className="absolute top-[187px] left-[505px] w-[177px] h-[128px]">
          {/* Logo placeholder - need actual asset */}
          <div className="w-full h-full bg-white/10 rounded-lg" />
        </div>

        {/* Main heading: экскурсия по платформе за 2 минуты (7:129) */}
        <h1 className="absolute top-[337px] left-[94px] w-[1027px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          экскурсия по платформе за 2 минуты
        </h1>

        {/* Video container: видео с обзором (7:131) */}
        <div className="absolute top-[556px] left-[144px] w-[891px] h-[1457px]">
          {/* Video thumbnail/poster: IMAGE 2025-12-26 06:59:59 1 (7:132) */}
          <div className="absolute inset-0 bg-gray-800 rounded-[40px] overflow-hidden">
            {/* Video placeholder - need actual video/poster asset */}
            <div className="w-full h-full bg-black/50" />
          </div>

          {/* Video overlay blur: блюр на экскурсию (7:133) */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            {/* Shadow circle (7:135) */}
            <div className="absolute w-[104px] h-[104px] rounded-full border border-black/60 shadow-lg" />
          </div>

          {/* Play button: кнопка плей (7:139) */}
          <button className="absolute top-[619px] left-[397px] w-[98px] h-[98px] bg-black/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M15 10L30 20L15 30V10Z" fill="white"/>
            </svg>
          </button>

          {/* Pause button: кнопка стоп (7:136) */}
          <button className="absolute top-[728px] left-[398px] w-[98px] h-[98px] bg-black/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="12" y="10" width="6" height="20" fill="white"/>
              <rect x="22" y="10" width="6" height="20" fill="white"/>
            </svg>
          </button>

          {/* Fullscreen button: кнопка развернуть видео (7:142) */}
          <button className="absolute bottom-[11px] right-[9px] w-[72px] h-[72px] bg-black/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
            <div className="w-[42px] h-[42px]">
              {/* Fullscreen icon placeholder */}
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                <path d="M8 8H16V12H12V16H8V8ZM34 8V16H30V12H26V8H34ZM8 34V26H12V30H16V34H8ZM30 34V30H26V26H34V34H30Z" fill="white"/>
              </svg>
            </div>
          </button>
        </div>

        {/* CTA Button: кнопка попробовать бесплатно (7:146) */}
        <button className="absolute bottom-[527px] left-[144px] w-[891px] h-[139px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden group">
          {/* Gradient background: colors (7:147-7:150) */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute top-[-150px] left-[100px] w-[576px] h-[423px] bg-[#37ecf7] rounded-full blur-[100px]" />
            <div className="absolute top-[-200px] left-[200px] w-[511px] h-[310px] bg-[#f0d825] rounded-full blur-[100px]" />
            <div className="absolute bottom-[-150px] right-[100px] w-[317px] h-[287px] bg-[#d5fc44] rounded-full blur-[100px]" />
          </div>
          
          {/* Button text: попробовать бесплатно (7:151) */}
          <span className="relative z-10 text-white text-[40px] font-['Gotham_Pro'] font-medium leading-[40px]">
            попробовать бесплатно
          </span>
        </button>

        {/* Legal texts */}
        {/* Privacy policy text (7:127) */}
        <p className="absolute bottom-[458px] left-[137px] w-[399px] h-[60px] text-white text-[20px] font-['Milligram_Macro_Trial'] font-bold leading-[20px]">
          нажимая на кнопку, вы соглашаетесь<br />
          с политикой конфиденциальности МЕТАФЛОРА*
        </p>

        {/* Marketing consent text (7:128) */}
        <p className="absolute bottom-[458px] right-[137px] w-[428px] h-[60px] text-white text-[20px] font-['Milligram_Macro_Trial'] font-bold leading-[20px] text-right">
          нажимая на кнопку, вы соглашаетесь<br />
          на получение информационной<br />
          и рекламной рассылки МЕТАФЛОРА*
        </p>

        {/* Footer: хэдер и подвал (7:154) */}
        <footer className="absolute bottom-[44px] left-[125px] right-[125px]">
          {/* Footer logo: IMG_3839-Photoroom 1 (7:155) */}
          <div className="mb-[20px]">
            <div className="w-[587px] h-[125px] bg-white/10 rounded-lg">
              {/* Footer logo placeholder - need actual asset */}
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex justify-between items-center">
            {/* Copyright text (7:156) */}
            <p className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px]">
              Copyright ©<br />
              Все права защищены.
            </p>

            {/* Social links: соцсети (7:157, 7:158) */}
            <div className="flex items-center gap-[10px] px-[17px] py-[13px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30">
              {/* Social icons placeholders (7:159, 7:160) */}
              <div className="w-[50px] h-[51px] bg-white/20 rounded-full" />
              <div className="w-[142px] h-[51px] bg-white/20 rounded-lg" />
            </div>
          </div>
        </footer>
      </div>
    </ScreenRoot>
  );
}
