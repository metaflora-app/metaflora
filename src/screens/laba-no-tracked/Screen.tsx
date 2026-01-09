/**
 * экран еще нет отслеживаемых лаба (7:1330)
 * Laba No Tracked Screen - 1180x2550px
 */


import { ScreenRoot } from '../../components/layout';

export default function LabaNoTrackedScreen() {
  return (
    <ScreenRoot className="bg-[#020101] relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full opacity-10">
        <div className="grid grid-cols-4 gap-0 w-full h-full">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-full h-full bg-black opacity-5" />
          ))}
        </div>
      </div>

      <div className="relative w-[1180px] h-[2550px] mx-auto">
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

        <h1 className="absolute top-[337px] left-[85px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          отслеживаемые
        </h1>

        {/* Empty state */}
        <div className="absolute top-[900px] left-[240px] w-[700px] text-center">
          <p className="text-white text-[60px] font-['Inter'] font-bold leading-[60px] mb-[30px]">
            пока нет отслеживаемых<br />аккаунтов
          </p>
          <p className="text-white text-[32px] font-['Gotham_Pro'] font-light leading-[32px] mb-[50px]">
            начните анализировать контент,<br />чтобы добавить аккаунты в избранное
          </p>
          
          {/* Button: начать отслеживание */}
          <button className="w-[400px] h-[80px] bg-black/90 backdrop-blur rounded-[62px] border border-white/30 overflow-hidden mx-auto">
            <div className="absolute inset-0">
              <div className="absolute top-[-40px] left-[80px] w-[200px] h-[150px] bg-[#814cf3] rounded-full blur-[60px]" />
              <div className="absolute top-[-50px] left-[150px] w-[180px] h-[110px] bg-[#d5fc44] rounded-full blur-[60px]" />
            </div>
            <span className="relative z-10 text-white text-[32px] font-['Gotham_Pro'] font-medium">
              начать отслеживание
            </span>
          </button>
        </div>

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
