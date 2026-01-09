/**
 * экран политика конфиденциальности (7:2854)
 * Privacy Policy Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - политика конфиденциальности... (7:2883) → main heading
 * - главная подложка (7:2899) → outer container (886x1560)
 * - карточка промпта (7:2900) → content card
 * - подложка вторая (черная) (7:2901) → black inner card (801x1453)
 * - подложка последняя (7:2902) → content area (734x1367)
 * - Legal text (7:2903) → full privacy policy text
 */


import { ScreenRoot } from '../../components/layout';

export default function PrivacyPolicyScreen() {
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
        <div className="absolute top-[930px] left-[120px] flex gap-[2px]">
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

        <button className="absolute top-[916px] right-[120px] w-[205px] h-[78px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
          <span className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center">
            написать<br />в поддержку
          </span>
        </button>

        <div className="absolute top-[866px] left-[505px] w-[177px] h-[128px] bg-white/10 rounded-lg" />

        {/* Heading (7:2883) */}
        <h1 className="absolute top-[1017px] left-[95px] w-[1020px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          политика<br />конфиденциальности<br />и обработки<br />персональных данных
        </h1>

        {/* Main container (7:2899) */}
        <div className="absolute top-[1380px] left-[147px] w-[886px] h-[1560px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30">
          {/* Content card (7:2900) */}
          <div className="absolute top-[47px] left-[45px] w-[801px] h-[1453px] bg-black rounded-[30px] border border-white/30 p-[33px]">
            {/* Content area (7:2902) */}
            <div className="w-[734px] h-[1367px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[53px]">
              {/* Privacy policy text (7:2903) */}
              <div className="text-white text-[35px] font-['TT_Commons'] font-light leading-[35px] text-center overflow-y-auto">
                <p className="mb-[35px]">
                  Настоящая Политика конфиденциальности и обработки персональных данных (далее — Политика) определяет порядок обработки и защиты персональных данных пользователей, предоставляемых при использовании сайта, сервисов и услуг индивидуального предпринимателя.
                </p>
                
                <h2 className="text-[40px] font-bold mb-[20px]">1. Общие положения</h2>
                
                <p className="mb-[25px]">
                  1.1. Настоящая Политика разработана в соответствии с Конституцией Российской Федерации, Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных», иными нормативными правовыми актами Российской Федерации.
                </p>
                
                <p className="mb-[25px]">
                  1.2. Оператором персональных данных является:<br />
                  Индивидуальный предприниматель Мищенко Иван Сергеевич<br />
                  ИНН: 440703001205<br />
                  ОГРН: 323440000024387<br />
                  Юридический адрес: 157500, Россия, Костромская область, Шарьинский район, г. Шарья, Садовый переулок, д. 5
                </p>
                
                <p className="mb-[25px]">
                  1.3. Используя сайт, оформляя заявки, регистрируясь, оплачивая услуги или иным образом взаимодействуя с Оператором, пользователь подтверждает своё согласие с настоящей Политикой.
                </p>
                
                <p>
                  1.4. Оператор обрабатывает персональные данные законно, справедливо и ограничивается достижением конкретных, заранее определённых и законных целей.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer (7:2891) */}
        <footer className="absolute bottom-[723px] left-[125px] right-[125px]">
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
