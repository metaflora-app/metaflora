/**
 * внутри урока академии (материалы) (7:2022)
 * Academy Lesson Materials Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - материалы урока (7:2066) → main heading
 * - внутри: саммари урока... (7:2067) → subtitle
 * - Frame 12343455 (7:2052) → main container (930x1189)
 * - карточка промпта (7:2053) → materials card (840x1101)
 * - Frame 12343457 (7:2055) → content text area (759x882)
 * - морфинг через общие элементы (7:2057) → content title
 * - идея в том, чтобы... (7:2058, 7:2059) → content text
 * - Frame 12343461 (7:2060) → "промпты" tab (white gradient)
 * - Frame 12343461 (7:2070) → "материалы" tab (yellow gradient, active)
 * - скачать файлы (5) (7:2056) → download button text
 * - ba72c2de... (7:2049) → large background image
 */


import { ScreenRoot } from '../../components/layout';

export default function AcademyLessonMaterialsScreen() {
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

        {/* Heading (7:2066) */}
        <h1 className="absolute top-[337px] left-[85px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          материалы урока
        </h1>

        {/* Subtitle (7:2067) */}
        <p className="absolute top-[436px] left-[85px] w-[882px] text-white text-[40px] font-['Graphik_LC_Web'] font-medium leading-[40px]">
          внутри: саммари урока, исползованные промпты, файлы генераций
        </p>

        {/* Main container (7:2052) */}
        <div className="absolute top-[601px] left-[125px] w-[930px] h-[1189px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30">
          {/* Materials card (7:2053) */}
          <div className="absolute top-[43px] left-[48px] w-[840px] h-[1101px] bg-black rounded-[30px] border border-white/30 p-[41px]">
            {/* Title (7:2057) */}
            <h2 className="text-white text-[52px] font-['Inter'] font-bold leading-[52px] text-center mb-[22px]">
              морфинг через общие элементы
            </h2>

            {/* Content text area (7:2055) */}
            <div className="w-[759px] h-[882px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[48px] mb-[9px] mx-auto relative">
              {/* Text content (7:2058, 7:2059) */}
              <p className="text-white text-[35px] font-['TT_Commons'] font-light leading-[35px] text-center">
                идея в том, чтобы в конце одного кадра был объект, похожий по форме или цвету на объект в начале следующего. Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом клипе огонь должен постепенно заполнить весь кадр:
              </p>
              <p className="text-white text-[35px] font-['TT_Commons'] font-light leading-[35px] text-center mt-[35px]">
                A close-up of a campfire burning intensely, flames dancing and flickering, the fire gradually fills the entire frame, warm orange glow.<br />
                А второй клип начинается с солнца, которое тоже заполняет кадр:<br />
                <br />
                A bright orange sun rising over the ocean horizon, starting as a small glowing orb that fills the frame, golden light reflecting on water.<br />
                Оба объекта оранжевые, оба занимают весь экран — нейросеть сама выстроит между ними.
              </p>

              {/* Plus icon (7:2068) */}
              <button className="absolute bottom-[117px] right-[186px] w-[35px] h-[35px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 0V15M0 7.5H15" stroke="white" strokeWidth="2"/>
                </svg>
              </button>
            </div>

            {/* Tab buttons */}
            <div className="flex gap-[10px] mb-[9px] justify-center">
              {/* Tab: промпты (7:2060) */}
              <button className="w-[170px] h-[48px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-[-20px] left-[28px] w-[59px] h-[89px] bg-white rounded-full blur-[25px] opacity-30" />
                </div>
                <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium">промпты</span>
              </button>

              {/* Tab: материалы (7:2070) - ACTIVE */}
              <button className="w-[170px] h-[47px] bg-black backdrop-blur rounded-[62px] border border-white/30 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-[-20px] left-[28px] w-[76px] h-[89px] bg-[#fdc615] rounded-full blur-[25px]" />
                  <div className="absolute top-[-25px] left-[35px] w-[67px] h-[65px] bg-[#fdc615] rounded-full blur-[25px]" />
                  <div className="absolute bottom-[-20px] right-[28px] w-[42px] h-[60px] bg-[#fffdc6] rounded-full blur-[25px]" />
                </div>
                <span className="relative z-10 text-white text-[16px] font-['Gotham_Pro'] font-medium">материалы</span>
              </button>
            </div>

            {/* Download button text (7:2056) */}
            <p className="text-white text-[32px] font-['Gotham_Pro'] font-medium leading-[32px] text-center">
              скачать файлы (5)
            </p>
          </div>
        </div>

        {/* Large background image (7:2049) */}
        <div className="absolute top-[1004px] left-[59px] w-[1117px] h-[1191px] bg-white/5 rounded-[40px]" />

        {/* Footer (7:2082) */}
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
