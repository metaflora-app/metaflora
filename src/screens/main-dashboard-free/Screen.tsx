/**
 * главный экран (без подписки) (7:162)
 * Main Dashboard Free Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - фон точки (7:163) → background pattern
 * - неопознанный бобёр (7:217) → main heading
 * - Profile section → avatar + username + demo-course badge + metacoins
 * - карточка сервиса (7:221) → demo course card with "перейти" button
 * - Service cards → лаба, промтер, полигон, чат, канал
 * - Frame 12343458 (7:237) → main CTA button
 * - выход (7:235) → back button
 * - хэдер и подвал (7:254) → header/footer components
 */


import { ScreenRoot } from '../../components/layout';

export default function MainDashboardFreeScreen() {
  return (
    <ScreenRoot className="bg-[#020101] relative overflow-hidden">
      {/* Background pattern: фон точки (7:163) */}
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
          {/* Back button: выход (7:235) */}
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M29.375 11.75L17.625 23.5L29.375 35.25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Support button: написать в поддержку (7:243, 7:244) */}
          <button className="w-[205px] h-[78px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
            <span className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center">
              написать<br />в поддержку
            </span>
          </button>
        </div>

        {/* Logo: лого-Photoroom 1 (7:261) */}
        <div className="absolute top-[187px] left-[505px] w-[177px] h-[128px]">
          <div className="w-full h-full bg-white/10 rounded-lg" />
        </div>

        {/* Main heading: неопознанный бобёр (7:217) */}
        <h1 className="absolute top-[337px] left-[85px] w-[1020px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          неопознанный бобёр
        </h1>

        {/* Profile section */}
        <div className="absolute top-[463px] left-[79px] flex items-center gap-[35px]">
          {/* Avatar: Ellipse 3941 + IMG_3919 2 (7:191, 7:215) */}
          <div className="w-[159px] h-[159px] rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
            {/* Avatar placeholder */}
            <div className="w-full h-full bg-white/10" />
          </div>

          {/* User info */}
          <div>
            {/* Username: гость (7:213) */}
            <p className="text-white text-[40px] font-['Gotham_Pro'] font-normal leading-[40px]">
              гость
            </p>
            {/* Status badge: демо-курс (7:214) */}
            <p className="text-white text-[40px] font-['Gotham_Pro'] font-bold leading-[40px]">
              демо-курс
            </p>
          </div>

          {/* Metacoins section: 150 метакоинов (7:251-7:253) */}
          <div className="absolute right-[-550px] flex items-center gap-[18px]">
            {/* Coin icon placeholder (7:253) */}
            <div className="w-[109px] h-[109px] rounded-full bg-purple-900/20 border border-white/30 flex items-center justify-center">
              <div className="w-[70px] h-[70px] rounded-full bg-yellow-500/30" />
            </div>
            
            <div>
              {/* Metacoins amount (7:251) */}
              <p className="text-white text-[45px] font-['TT_Commons'] font-bold leading-[45px]">
                150 метакоинов
              </p>
              {/* Refill button: кнопка пополнить (7:245) */}
              <button className="mt-[7px] w-[176px] h-[57px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                {/* Red gradient (7:246-7:249) */}
                <div className="absolute inset-0">
                  <div className="absolute top-[-30px] left-[12px] w-[88px] h-[148px] bg-[#fa002d] rounded-full blur-[40px]" />
                  <div className="absolute top-[-40px] left-[22px] w-[78px] h-[108px] bg-[#f0d825] rounded-full blur-[40px]" />
                  <div className="absolute bottom-[-30px] right-[12px] w-[48px] h-[100px] bg-[#d5fc44] rounded-full blur-[40px]" />
                </div>
                <span className="relative z-10 text-white text-[23px] font-['Gotham_Pro'] font-medium leading-[23px]">
                  пополнить
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Demo course card: карточка сервиса (7:221) */}
        <div className="absolute top-[731px] left-[129px] w-[926px] h-[249px] rounded-[30px] overflow-hidden">
          {/* Card background image (7:222) */}
          <div className="absolute left-[4px] top-[5px] w-[465px] h-[241px] rounded-[26px] bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
          
          {/* Description panel (7:231) */}
          <div className="absolute right-[0px] top-[0px] w-[461px] h-[249px] bg-black rounded-[30px] border border-white/30 p-[36px]">
            {/* Demo badge (7:229) */}
            <div className="absolute top-[16px] left-[-179px] w-[103px] h-[31px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
              <span className="text-white text-[12px] font-['Gotham_Pro'] font-bold leading-[12px]">
                демо-курс
              </span>
            </div>

            {/* Description text (7:232) */}
            <p className="text-white text-[23px] font-['Gotham_Pro'] font-light leading-[23px] text-center">
              Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
            </p>
          </div>

          {/* "Перейти" button (7:223) */}
          <button className="absolute left-[104px] bottom-[14px] w-[266px] h-[73px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
            {/* White gradient (7:224-7:227) */}
            <div className="absolute inset-0">
              <div className="absolute top-[-35px] left-[35px] w-[102px] h-[107px] bg-white rounded-full blur-[50px] opacity-30" />
            </div>
            <span className="relative z-10 text-white text-[27px] font-['Gotham_Pro'] font-medium leading-[27px]">
              перейти
            </span>
          </button>
        </div>

        {/* Service cards grid */}
        <div className="absolute top-[1042px] left-[125px] w-[930px]">
          {/* Large container frame (7:212) */}
          <div className="w-[930px] h-[1208px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[0px]">
            {/* Card: лаба /lab (7:192, 7:193) */}
            <div className="absolute top-[0px] left-[0px] w-[930px] h-[252px] rounded-[30px] bg-yellow-900/20 overflow-hidden">
              <div className="absolute right-[24px] top-[76px]">
                <p className="text-black text-[50px] font-['Inter'] font-bold leading-[50px]">
                  лаба<br />/lab
                </p>
              </div>
              {/* "топ-выбор" badge (7:197, 7:198) */}
              <div className="absolute top-[14px] right-[8px] w-[122px] h-[36px] rounded-[30px] flex items-center justify-center"
                   style={{
                     background: 'linear-gradient(90deg, #ffc300 0%, #f2da8c 52%, #ffc300 100%)'
                   }}>
                <span className="text-black text-[15px] font-['Inter'] font-bold leading-[15px]">
                  топ-выбор
                </span>
              </div>
            </div>

            {/* Card: промтер /promter (7:199, 7:200) */}
            <div className="absolute top-[311px] left-[0px] w-[930px] h-[252px] rounded-[30px] bg-pink-900/20 overflow-hidden">
              <div className="absolute right-[351px] top-[76px]">
                <p className="text-black text-[50px] font-['Inter'] font-bold leading-[50px]">
                  промтер<br />/promter
                </p>
              </div>
            </div>

            {/* Card: полигон /poligon (7:204, 7:205) */}
            <div className="absolute top-[624px] left-[0px] w-[930px] h-[252px] rounded-[30px] bg-blue-900/20 overflow-hidden">
              <div className="absolute right-[354px] top-[76px]">
                <p className="text-black text-[50px] font-['Inter'] font-bold leading-[50px]">
                  полигон<br />/poligon
                </p>
              </div>
            </div>

            {/* Bottom row: chat + channel */}
            <div className="absolute top-[956px] left-[0px] flex gap-[60px]">
              {/* Card: чат /chat (7:207, 7:208) */}
              <div className="w-[435px] h-[252px] rounded-[30px] bg-green-900/20 overflow-hidden">
                <div className="absolute left-[159px] top-[76px]">
                  <p className="text-black text-[50px] font-['Inter'] font-bold leading-[50px]">
                    чат<br />/chat
                  </p>
                </div>
              </div>

              {/* Card: канал /channel (7:209, 7:210) */}
              <div className="w-[434px] h-[252px] rounded-[30px] bg-cyan-900/20 overflow-hidden border border-white/30">
                <div className="absolute left-[622px] top-[76px]">
                  <p className="text-black text-[50px] font-['Inter'] font-bold leading-[50px]">
                    канал<br />/channel
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main CTA Button: Frame 12343458 (7:237) */}
        <button className="absolute bottom-[527px] left-[144px] w-[892px] h-[139px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
          {/* Gradient background: colors (7:238-7:241) */}
          <div className="absolute inset-0">
            <div className="absolute top-[-150px] left-[100px] w-[616px] h-[423px] bg-[#fa002d] rounded-full blur-[100px]" />
            <div className="absolute top-[-200px] left-[250px] w-[547px] h-[310px] bg-[#f0d825] rounded-full blur-[100px]" />
            <div className="absolute bottom-[-150px] right-[80px] w-[339px] h-[287px] bg-[#d5fc44] rounded-full blur-[100px]" />
          </div>
          
          {/* Button text: оплатить полный доступ (7:242) */}
          <span className="relative z-10 text-white text-[40px] font-['Gotham_Pro'] font-medium leading-[40px]">
            оплатить полный доступ
          </span>
        </button>

        {/* Redirect notice: вы будете перенаправлены... (7:220) */}
        <p className="absolute bottom-[297px] left-[297px] w-[586px] text-white text-[32px] font-['Graphik_LCG'] font-bold leading-[32px] text-center">
          вы будете перенаправлены<br />
          на страницу с выбором подписки
        </p>

        {/* Large logo: IMG_3837-Photoroom 1 (7:190) */}
        <div className="absolute top-[1434px] left-[27px] w-[1137px] h-[861px]">
          <div className="w-full h-full bg-white/5 rounded-[40px]" />
        </div>

        {/* Footer: хэдер и подвал (7:254) */}
        <footer className="absolute bottom-[44px] left-[125px] right-[125px]">
          {/* Footer logo: IMG_3839-Photoroom 1 (7:255) */}
          <div className="mb-[20px]">
            <div className="w-[587px] h-[125px] bg-white/10 rounded-lg" />
          </div>

          {/* Bottom row */}
          <div className="flex justify-between items-center">
            {/* Copyright text (7:256) */}
            <p className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px]">
              Copyright ©<br />
              Все права защищены.
            </p>

            {/* Social links: соцсети (7:257, 7:258) */}
            <div className="flex items-center gap-[10px] px-[17px] py-[13px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30">
              {/* Social icons placeholders (7:259, 7:260) */}
              <div className="w-[50px] h-[51px] bg-white/20 rounded-full" />
              <div className="w-[142px] h-[51px] bg-white/20 rounded-lg" />
            </div>
          </div>
        </footer>
      </div>
    </ScreenRoot>
  );
}
