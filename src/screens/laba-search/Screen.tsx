/**
 * экран поиска лаба (7:665)
 * Laba Search Screen - 1180x2550px - WITH SEARCH BAR
 * 
 * Figma→Code mapping:
 * - IMAGE 2025-12-26 07:06:48 1 (7:694) → left placeholder (449x1867)
 * - IMAGE 2025-12-26 07:06:48 2 (7:695) → right placeholder (449x1867)
 * - Frame 12343458 (7:702) → bottom navigation bar (683x139)
 * - Navigation icons (7:710, 7:705, 7:703, 7:704) → главный, следить, избранное, пополнить
 * - Navigation labels (7:706-7:709) → button labels
 */


import { ScreenRoot } from '../../components/layout';
import { useNavigate } from 'react-router-dom';

export default function LabaSearchScreen() {
  const navigate = useNavigate();

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

        {/* Left placeholder image (7:694) */}
        <div className="absolute top-[341px] left-[125px] w-[449px] h-[1867px] rounded-[30px] bg-gradient-to-br from-purple-900/10 to-blue-900/10 border border-white/30">
          {/* Loading skeleton */}
        </div>

        {/* Right placeholder image (7:695) */}
        <div className="absolute top-[341px] left-[606px] w-[449px] h-[1867px] rounded-[30px] bg-gradient-to-br from-pink-900/10 to-purple-900/10 border border-white/30">
          {/* Loading skeleton */}
        </div>

        {/* Bottom navigation bar: Frame 12343458 (7:702) */}
        <div className="absolute bottom-[503px] left-[252px] w-[683px] h-[139px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-around px-[20px]">
          {/* Nav button 1: главный (7:710, 7:706) */}
          <button className="flex flex-col items-center gap-[7px]">
            <div className="w-[103px] h-[101px] bg-white/10 rounded-[20px] flex items-center justify-center">
              {/* Icon placeholder */}
              <div className="w-[60px] h-[60px] bg-white/20 rounded-full" />
            </div>
            <span className="text-white text-[19px] font-['Gotham_Pro'] font-medium">главный</span>
          </button>

          {/* Nav button 2: следить (7:705, 7:709) - navigates to content tracking */}
          <button 
            className="flex flex-col items-center gap-[7px]"
            onClick={() => navigate('/content-tracking')}
          >
            <div className="w-[103px] h-[100px] bg-white/10 rounded-[20px] flex items-center justify-center">
              <div className="w-[60px] h-[60px] bg-white/20 rounded-full" />
            </div>
            <span className="text-white text-[19px] font-['Gotham_Pro'] font-medium">следить</span>
          </button>

          {/* Nav button 3: избранное (7:703, 7:707) */}
          <button className="flex flex-col items-center gap-[7px]">
            <div className="w-[103px] h-[99px] bg-white/10 rounded-[20px] flex items-center justify-center">
              <div className="w-[60px] h-[60px] bg-white/20 rounded-full" />
            </div>
            <span className="text-white text-[19px] font-['Gotham_Pro'] font-medium">избранное</span>
          </button>

          {/* Nav button 4: пополнить (7:704, 7:708) */}
          <button className="flex flex-col items-center gap-[7px]">
            <div className="w-[103px] h-[105px] bg-white/10 rounded-[20px] flex items-center justify-center">
              <div className="w-[60px] h-[60px] bg-white/20 rounded-full" />
            </div>
            <span className="text-white text-[19px] font-['Gotham_Pro'] font-medium">пополнить</span>
          </button>
        </div>

        {/* Footer (7:711) */}
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
