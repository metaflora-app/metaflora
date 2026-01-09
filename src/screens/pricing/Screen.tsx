/**
 * экран цены (7:2548)
 * Pricing Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - фон точки (7:2549) → background pattern
 * - выберите вариант подписки (7:2606) → main heading
 * - карточка тарифа 1 месяц (7:2607) → 1-month pricing card with 2 options
 * - карточка тарифа 3 месяца (7:2576) → 3-month pricing card with "выгодно" badge
 * - Frame 12343458 (7:2636) → main CTA button "оплатить доступ"
 * - выход (7:2634) → back button
 * - хэдер и подвал (7:2644) → header/footer components
 */


import { ScreenRoot } from '../../components/layout';

export default function PricingScreen() {
  return (
    <ScreenRoot className="bg-[#020101] relative overflow-hidden">
      {/* Background pattern: фон точки (7:2549) */}
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
          {/* Back button: выход (7:2634) */}
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M29.375 11.75L17.625 23.5L29.375 35.25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Support button: написать в поддержку (7:2642, 7:2643) */}
          <button className="w-[205px] h-[78px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
            <span className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center">
              написать<br />в поддержку
            </span>
          </button>
        </div>

        {/* Logo: лого-Photoroom 1 (7:2651) */}
        <div className="absolute top-[187px] left-[505px] w-[177px] h-[128px]">
          <div className="w-full h-full bg-white/10 rounded-lg" />
        </div>

        {/* Main heading: выберите вариант подписки (7:2606) */}
        <h1 className="absolute top-[337px] left-[94px] w-[1020px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          выберите вариант<br />подписки
        </h1>

        {/* 1 MONTH CARD: карточка тарифа 1 месяц (7:2607) */}
        <div className="absolute top-[557px] left-[131px] w-[930px] h-[603px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[63px]">
          {/* Card title: 1 месяц (7:2631) */}
          <h2 className="text-white text-[80px] font-['Inter'] font-extrabold leading-[80px] mb-[26px]">
            1 месяц
          </h2>

          {/* Info tooltip container */}
          <div className="absolute top-[8px] right-[8px] flex items-center gap-[10px]">
            {/* Tooltip box: обводка подробнее про списание (7:2615) */}
            <div className="px-[15px] py-[11px] border border-white/30 rounded-[30px]">
              <p className="text-white text-[10px] font-['Gotham_Pro'] font-light leading-[10px] w-[255px]">
                списание средств происходит ежемесячно.<br />
                Вы можете отменить подписку в любой момент
              </p>
            </div>
            
            {/* Info icon: иконка подробнее про списание (7:2609) */}
            <div className="w-[26px] h-[26px] bg-white/10 rounded-full border border-white/30 flex items-center justify-center">
              <span className="text-white text-[14px]">i</span>
            </div>
          </div>

          {/* Features list: доступ к МЕТАФЛОРА* ... (7:2632) */}
          <div className="text-white text-[40px] font-['Graphik_LC_Web'] font-medium leading-[40px] space-y-0">
            <p>доступ к МЕТАФЛОРА* академия: большой цикл курсов по ИИ</p>
            <p>доступ к МЕТАФЛОРА* лаба:</p>
            <p>контент-среда и личный креатор 24/7</p>
            <p>доступ к МЕТАФЛОРА* цех:</p>
            <p>промты для любой задачи</p>
            <p>доступ к МЕТАФЛОРА* полигон:</p>
            <p>статьи с разборами ИИ-новинок</p>
            <p>а также: общий чат, канал и бонусы каждый месяц</p>
          </div>

          {/* Price buttons row */}
          <div className="absolute bottom-[57px] right-[18px] flex gap-[0]">
            {/* Price button 1: кнопка цена 2690 (7:2623) */}
            <button className="w-[176px] h-[57px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
              {/* White gradient (7:2624-7:2627) */}
              <div className="absolute inset-0">
                <div className="absolute top-[-30px] left-[10px] w-[73px] h-[148px] bg-white rounded-full blur-[40px] opacity-30" />
              </div>
              <span className="relative z-10 text-white text-[23px] font-['Gotham_Pro'] font-medium leading-[23px]">
                2690 руб.
              </span>
            </button>

            {/* Price button 2: кнопка цена 1990 (7:2617) */}
            <button className="w-[176px] h-[57px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden ml-[-1px]">
              {/* Cyan/yellow gradient (7:2618-7:2621) */}
              <div className="absolute inset-0">
                <div className="absolute top-[-30px] left-[15px] w-[70px] h-[148px] bg-[#37ecf7] rounded-full blur-[40px]" />
                <div className="absolute top-[-40px] left-[25px] w-[62px] h-[108px] bg-[#f0d825] rounded-full blur-[40px]" />
                <div className="absolute bottom-[-30px] right-[15px] w-[39px] h-[100px] bg-[#d5fc44] rounded-full blur-[40px]" />
              </div>
              <span className="relative z-10 text-white text-[23px] font-['Gotham_Pro'] font-medium leading-[23px]">
                1990 руб.
              </span>
            </button>
          </div>
        </div>

        {/* 3 MONTH CARD: карточка тарифа 3 месяца (7:2576) */}
        <div className="absolute top-[1221px] left-[131px] w-[930px] h-[603px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[63px]">
          {/* Card background image: IMAGE 2025-12-26 07:06:48 1 (7:2577) */}
          <div className="absolute top-[3px] left-[4px] w-[922px] h-[348px] rounded-[21px] bg-gradient-to-br from-purple-900/20 to-blue-900/20" />

          {/* Card title: 3 месяца (7:2580) */}
          <h2 className="relative z-10 text-white text-[80px] font-['Inter'] font-extrabold leading-[80px] mb-[26px]">
            3 месяца
          </h2>

          {/* "Выгодно" badge: кнопка выгодно (7:2595, 7:2603) */}
          <div className="absolute top-[42px] right-[55px] w-[74px] h-[34px] rounded-[20px] flex items-center justify-center"
               style={{
                 background: 'linear-gradient(90deg, #880709 0%, #e90004 52%, #880709 100%)'
               }}>
            <span className="text-white text-[10px] font-['Inter'] font-bold leading-[10px]">
              выгодно
            </span>
          </div>

          {/* Info tooltip container */}
          <div className="absolute top-[46px] right-[165px] flex items-center gap-[10px]">
            {/* Tooltip box: Rectangle 240652428 (7:2587) */}
            <div className="px-[15px] py-[11px] border border-white/30 rounded-[30px]">
              <p className="text-white text-[10px] font-['Gotham_Pro'] font-light leading-[10px] w-[255px]">
                списание средств происходит ежемесячно.<br />
                Вы можете отменить подписку в любой момент
              </p>
            </div>
            
            {/* Info icon: Group 1597882556 (7:2581) */}
            <div className="w-[26px] h-[26px] bg-white/10 rounded-full border border-white/30 flex items-center justify-center">
              <span className="text-white text-[14px]">i</span>
            </div>
          </div>

          {/* Features list: доступ к МЕТАФЛОРА* ... (7:2579) */}
          <div className="relative z-10 text-white text-[40px] font-['Graphik_LC_Web'] font-medium leading-[40px] space-y-0">
            <p>доступ к МЕТАФЛОРА* академия: большой цикл курсов по ИИ</p>
            <p>доступ к МЕТАФЛОРА* лаба:</p>
            <p>контент-среда и личный креатор 24/7</p>
            <p>доступ к МЕТАФЛОРА* цех:</p>
            <p>промты для любой задачи</p>
            <p>доступ к МЕТАФЛОРА* полигон:</p>
            <p>статьи с разборами ИИ-новинок</p>
            <p>а также: чат, канал и другие бонусы</p>
            <p>каждый месяц</p>
          </div>

          {/* Price buttons row */}
          <div className="absolute bottom-[57px] right-[18px] flex gap-[0]">
            {/* Price button 1 (strikethrough): кнопка цена 8070 (7:2596) */}
            <button className="w-[176px] h-[57px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden relative">
              {/* White gradient (7:2597-7:2600) */}
              <div className="absolute inset-0">
                <div className="absolute top-[-30px] left-[10px] w-[73px] h-[148px] bg-white rounded-full blur-[40px] opacity-30" />
              </div>
              <span className="relative z-10 text-white text-[23px] font-['Gotham_Pro'] font-medium leading-[23px] line-through decoration-2">
                8070 руб.
              </span>
            </button>

            {/* Price button 2: кнопка цена 5490 (7:2589) */}
            <button className="w-[176px] h-[57px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden ml-[-1px]">
              {/* Cyan/yellow gradient (7:2590-7:2593) */}
              <div className="absolute inset-0">
                <div className="absolute top-[-30px] left-[15px] w-[70px] h-[148px] bg-[#37ecf7] rounded-full blur-[40px]" />
                <div className="absolute top-[-40px] left-[25px] w-[62px] h-[108px] bg-[#f0d825] rounded-full blur-[40px]" />
                <div className="absolute bottom-[-30px] right-[15px] w-[39px] h-[100px] bg-[#d5fc44] rounded-full blur-[40px]" />
              </div>
              <span className="relative z-10 text-white text-[23px] font-['Gotham_Pro'] font-medium leading-[23px]">
                5490 руб.
              </span>
            </button>
          </div>
        </div>

        {/* Main CTA Button: Frame 12343458 (7:2636) */}
        <button className="absolute bottom-[686px] left-[149px] w-[892px] h-[139px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
          {/* Gradient background: colors (7:2637-7:2640) */}
          <div className="absolute inset-0">
            <div className="absolute top-[-150px] left-[100px] w-[576px] h-[423px] bg-[#37ecf7] rounded-full blur-[100px]" />
            <div className="absolute top-[-200px] left-[200px] w-[511px] h-[310px] bg-[#f0d825] rounded-full blur-[100px]" />
            <div className="absolute bottom-[-150px] right-[100px] w-[317px] h-[287px] bg-[#d5fc44] rounded-full blur-[100px]" />
          </div>
          
          {/* Button text: оплатить доступ (7:2641) */}
          <span className="relative z-10 text-white text-[40px] font-['Gotham_Pro'] font-medium leading-[40px]">
            оплатить доступ
          </span>
        </button>

        {/* Footer: хэдер и подвал (7:2644) */}
        <footer className="absolute bottom-[44px] left-[125px] right-[125px]">
          {/* Footer logo: IMG_3839-Photoroom 1 (7:2645) */}
          <div className="mb-[20px]">
            <div className="w-[587px] h-[125px] bg-white/10 rounded-lg" />
          </div>

          {/* Bottom row */}
          <div className="flex justify-between items-center">
            {/* Copyright text (7:2646) */}
            <p className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px]">
              Copyright ©<br />
              Все права защищены.
            </p>

            {/* Social links: соцсети (7:2647, 7:2648) */}
            <div className="flex items-center gap-[10px] px-[17px] py-[13px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30">
              {/* Social icons placeholders (7:2649, 7:2650) */}
              <div className="w-[50px] h-[51px] bg-white/20 rounded-full" />
              <div className="w-[142px] h-[51px] bg-white/20 rounded-lg" />
            </div>
          </div>
        </footer>
      </div>
    </ScreenRoot>
  );
}
