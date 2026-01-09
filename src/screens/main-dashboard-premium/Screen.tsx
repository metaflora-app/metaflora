/**
 * главный экран (с подпиской) (7:270)
 * Main Dashboard Premium Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - Иван Сергеевич (7:317) → user name heading
 * - Profile section → avatar + status + metacoins
 * - Service cards → academy, промтер, лаба, полигон, чат with "открыть" buttons
 * - хэдер и подвал (7:375) → header/footer
 */


import { ScreenRoot } from '../../components/layout';

export default function MainDashboardPremiumScreen() {
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
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M29.375 11.75L17.625 23.5L29.375 35.25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="w-[205px] h-[78px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
            <span className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center">
              написать<br />в поддержку
            </span>
          </button>
        </div>

        {/* Logo */}
        <div className="absolute top-[187px] left-[505px] w-[177px] h-[128px] bg-white/10 rounded-lg" />

        {/* Heading: Иван Сергеевич (7:317) */}
        <h1 className="absolute top-[337px] left-[85px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          Иван Сергеевич
        </h1>

        {/* Profile section */}
        <div className="absolute top-[463px] left-[79px] flex items-center gap-[35px]">
          {/* Avatar (7:315) */}
          <div className="w-[159px] h-[159px] rounded-full overflow-hidden bg-gray-700">
            <div className="w-full h-full bg-white/10" />
          </div>

          {/* User info */}
          <div>
            <p className="text-white text-[45px] font-['TT_Commons'] font-light leading-[45px]">
              член комьюнити
            </p>
            <p className="text-white text-[45px] font-['TT_Commons'] font-bold leading-[45px]">
              полный доступ<br />до 31.12
            </p>
          </div>

          {/* Metacoins (7:362, 7:313, 7:299) */}
          <div className="absolute right-[-550px] flex items-center gap-[18px]">
            <div className="w-[109px] h-[109px] rounded-full bg-purple-900/20 border border-white/30" />
            <div>
              <p className="text-white text-[45px] font-['TT_Commons'] font-bold leading-[45px]">
                150 метакоинов
              </p>
              <button className="mt-[7px] w-[176px] h-[57px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-[-30px] left-[12px] w-[88px] h-[148px] bg-[#fa002d] rounded-full blur-[40px]" />
                </div>
                <span className="relative z-10 text-white text-[23px] font-['Gotham_Pro'] font-medium">пополнить</span>
              </button>
            </div>
          </div>
        </div>

        {/* Service card 1: Academy (7:319) */}
        <div className="absolute top-[731px] left-[129px] w-[926px] h-[249px] flex gap-[0px]">
          <div className="w-[465px] h-[249px] rounded-[30px] bg-gradient-to-br from-purple-900/20 to-blue-900/20 relative">
            <div className="absolute top-[16px] right-[173px] w-[103px] h-[31px] bg-white/10 border border-white/30 rounded-[62px] flex items-center justify-center">
              <span className="text-white text-[12px] font-['Gotham_Pro'] font-bold">новый урок</span>
            </div>
            <button className="absolute left-[104px] bottom-[14px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30">
              <span className="text-white text-[27px] font-['Gotham_Pro'] font-medium">открыть</span>
            </button>
          </div>
          <div className="w-[461px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
            <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
            </p>
          </div>
        </div>

        {/* Service card 2 (7:346, 7:353) */}
        <div className="absolute top-[1053px] left-[127px] w-[926px] h-[249px] flex gap-[0px]">
          <div className="w-[465px] h-[249px] rounded-[30px] bg-pink-900/20 relative">
            <button className="absolute left-[104px] bottom-[20px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30">
              <span className="text-white text-[27px] font-['Gotham_Pro'] font-medium">открыть</span>
            </button>
          </div>
          <div className="w-[461px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
            <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
            </p>
          </div>
        </div>

        {/* Service card 3 (7:336) */}
        <div className="absolute top-[1374px] left-[126px] w-[928px] h-[249px] flex gap-[0px]">
          <div className="w-[467px] h-[249px] rounded-[30px] bg-blue-900/20 relative">
            <button className="absolute left-[101px] bottom-[27px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30">
              <span className="text-white text-[27px] font-['Gotham_Pro'] font-medium">открыть</span>
            </button>
          </div>
          <div className="w-[461px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
            <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
            </p>
          </div>
        </div>

        {/* Service card 4 (7:318, 7:333) */}
        <div className="absolute top-[1692px] left-[129px] w-[927px] h-[249px] flex gap-[0px]">
          <div className="w-[463px] h-[249px] rounded-[30px] bg-green-900/20 relative">
            <button className="absolute left-[104px] bottom-[42px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30">
              <span className="text-white text-[27px] font-['Gotham_Pro'] font-medium">открыть</span>
            </button>
          </div>
          <div className="w-[464px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
            <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
            </p>
          </div>
        </div>

        {/* Service card 5 (7:305) */}
        <div className="absolute top-[2001px] left-[131px] w-[926px] h-[249px] flex gap-[0px]">
          <div className="w-[459px] h-[249px] rounded-[30px] bg-cyan-900/20 relative">
            <button className="absolute left-[104px] bottom-[51px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30">
              <span className="text-white text-[27px] font-['Gotham_Pro'] font-medium">открыть</span>
            </button>
          </div>
          <div className="w-[467px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
            <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
            </p>
          </div>
        </div>

        {/* Large logo (7:298) */}
        <div className="absolute top-[1438px] left-[27px] w-[1137px] h-[861px] bg-white/5 rounded-[40px]" />

        {/* Footer (7:375) */}
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
