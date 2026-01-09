/**
 * экран что входит в демо (7:2785)
 * Demo Access Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - фон точки (7:2786) → background pattern
 * - что входит в ваш демо-доступ (7:2823) → main heading
 * - лого большое в экране демо (7:2821) → large logo
 * - иконка что включено в демо (7:2815) → checkmark icon with cyan/yellow gradient
 * - курс на 4 урока (7:2813) → included features text
 * - иконка что не включено в демо (7:2826) → cross icon with red gradient
 * - без доступа к... (7:2814) → excluded features list
 * - кнопка продолжить (7:2824) → outline button
 * - кнопка оплатить полный доступ (7:2834) → filled CTA button with red gradient
 * - выход (7:2832) → back button
 * - хэдер и подвал (7:2842) → header/footer components
 */


import { ScreenRoot } from '../../components/layout';

export default function DemoAccessScreen() {
  return (
    <ScreenRoot className="bg-[#020101] relative overflow-hidden">
      {/* Background pattern: фон точки (7:2786) */}
      <div className="absolute inset-0 w-full h-full">
        <div className="w-full h-full opacity-10">
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
          {/* Back button: выход (7:2832) */}
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M29.375 11.75L17.625 23.5L29.375 35.25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Support button: написать в поддержку (7:2840, 7:2841) */}
          <button className="w-[205px] h-[78px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
            <span className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center">
              написать<br />в поддержку
            </span>
          </button>
        </div>

        {/* Logo: лого-Photoroom 1 (7:2849) */}
        <div className="absolute top-[187px] left-[505px] w-[177px] h-[128px]">
          {/* Logo placeholder */}
          <div className="w-full h-full bg-white/10 rounded-lg" />
        </div>

        {/* Main heading: что входит в ваш демо-доступ (7:2823) */}
        <h1 className="absolute top-[337px] left-[94px] w-[1020px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          что входит в ваш<br />
          демо-доступ
        </h1>

        {/* INCLUDED SECTION */}
        {/* Green checkmark icon: иконка что включено в демо (7:2815) */}
        <div className="absolute top-[598px] left-[98px] w-[98px] h-[98px] bg-black/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center overflow-hidden">
          {/* Gradient background: colors (7:2816-7:2819) */}
          <div className="absolute inset-0">
            <div className="absolute top-[-50px] left-[10px] w-[43px] h-[104px] bg-[#37ecf7] rounded-full blur-[30px]" />
            <div className="absolute top-[-60px] left-[20px] w-[38px] h-[76px] bg-[#f0d825] rounded-full blur-[30px]" />
            <div className="absolute bottom-[-40px] right-[10px] w-[24px] h-[70px] bg-[#d5fc44] rounded-full blur-[30px]" />
          </div>
          {/* Checkmark icon */}
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none" className="relative z-10">
            <path d="M10 25L20 35L40 15" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Included feature text: курс на 4 урока (7:2813) */}
        <p className="absolute top-[566px] left-[237px] w-[804px] h-[160px] text-white text-[40px] font-['Graphik_LCG'] font-bold leading-[40px]">
          курс на 4 урока из блоков МЕТАФЛОРА* академия: «система», «искусство», «промптинг»<br />
          и «автоматизация»
        </p>

        {/* EXCLUDED SECTION */}
        {/* Red cross icon: иконка что не включено в демо (7:2826) */}
        <div className="absolute top-[840px] left-[97px] w-[98px] h-[98px] bg-black/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center overflow-hidden">
          {/* Gradient background: colors (7:2827-7:2830) */}
          <div className="absolute inset-0">
            <div className="absolute top-[-50px] left-[10px] w-[54px] h-[108px] bg-[#fa002d] rounded-full blur-[30px]" />
            <div className="absolute top-[-60px] left-[20px] w-[48px] h-[79px] bg-[#f0d825] rounded-full blur-[30px]" />
            <div className="absolute bottom-[-40px] right-[10px] w-[30px] h-[73px] bg-[#d5fc44] rounded-full blur-[30px]" />
          </div>
          {/* Cross icon */}
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none" className="relative z-10">
            <path d="M15 15L35 35M35 15L15 35" stroke="white" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Excluded features list: без доступа к... (7:2814) */}
        <div className="absolute top-[787px] left-[239px] w-[845px] h-[200px] text-white text-[40px] font-['Futura_PT'] font-medium leading-[40px]">
          <p>без доступа к МЕТАФЛОРА* академия</p>
          <p>без доступа к МЕТАФЛОРА* лаба</p>
          <p>без доступа к МЕТАФЛОРА* цех</p>
          <p>без доступа к МЕТАФЛОРА* полигон</p>
          <p>без доступа к тг-чату МЕТАФЛОРЫ*</p>
        </div>

        {/* Large logo: лого большое в экране демо (7:2821) */}
        <div className="absolute top-[1006px] left-[16px] w-[1137px] h-[861px]">
          {/* Large logo placeholder */}
          <div className="w-full h-full bg-white/5 rounded-[40px]" />
        </div>

        {/* Continue button outline: кнопка продолжить (7:2824) */}
        <button className="absolute bottom-[686px] left-[148px] w-[891px] h-[139px] bg-transparent backdrop-blur rounded-[62px] border border-white/30">
          {/* Button text: продолжить (7:2825) */}
          <span className="text-white text-[40px] font-['Inter'] font-bold leading-[40px]">
            продолжить
          </span>
        </button>

        {/* CTA Button: кнопка оплатить полный доступ (7:2834) */}
        <button className="absolute bottom-[527px] left-[148px] w-[891px] h-[139px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden group">
          {/* Gradient background: colors (7:2835-7:2838) */}
          <div className="absolute inset-0 opacity-100">
            <div className="absolute top-[-150px] left-[100px] w-[616px] h-[423px] bg-[#fa002d] rounded-full blur-[100px]" />
            <div className="absolute top-[-200px] left-[250px] w-[547px] h-[310px] bg-[#f0d825] rounded-full blur-[100px]" />
            <div className="absolute bottom-[-150px] right-[80px] w-[339px] h-[287px] bg-[#d5fc44] rounded-full blur-[100px]" />
          </div>
          
          {/* Button text: оплатить полный доступ (7:2839) */}
          <span className="relative z-10 text-white text-[40px] font-['Gotham_Pro'] font-medium leading-[40px]">
            оплатить полный доступ
          </span>
        </button>

        {/* Footer: хэдер и подвал (7:2842) */}
        <footer className="absolute bottom-[44px] left-[125px] right-[125px]">
          {/* Footer logo: IMG_3839-Photoroom 1 (7:2843) */}
          <div className="mb-[20px]">
            <div className="w-[587px] h-[125px] bg-white/10 rounded-lg">
              {/* Footer logo placeholder */}
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex justify-between items-center">
            {/* Copyright text (7:2844) */}
            <p className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px]">
              Copyright ©<br />
              Все права защищены.
            </p>

            {/* Social links: соцсети (7:2845, 7:2846) */}
            <div className="flex items-center gap-[10px] px-[17px] py-[13px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30">
              {/* Social icons placeholders (7:2847, 7:2848) */}
              <div className="w-[50px] h-[51px] bg-white/20 rounded-full" />
              <div className="w-[142px] h-[51px] bg-white/20 rounded-lg" />
            </div>
          </div>
        </footer>
      </div>
    </ScreenRoot>
  );
}
