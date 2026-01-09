/**
 * Bottom Navigation for Laba section
 */

import { useNavigate, useLocation } from 'react-router-dom';

export function LabaBottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-[40px] left-1/2 -translate-x-1/2 w-[683px] h-[139px] bg-white/10 backdrop-blur-lg rounded-[62px] border border-white/30 flex items-center justify-around px-[20px] z-50">
      {/* главный */}
      <button
        onClick={() => navigate('/laba-main')}
        className="flex flex-col items-center gap-[7px]"
      >
        <div className={`w-[103px] h-[101px] rounded-[20px] border border-white/30 flex items-center justify-center transition-colors ${
          isActive('/laba-main') ? 'bg-white/20' : 'bg-white/10'
        }`}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <path d="M10 25L30 10L50 25V48H35V32H25V48H10V25Z" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-white text-[19px] font-['Gotham_Pro'] font-medium">главный</span>
      </button>

      {/* следить */}
      <button
        onClick={() => navigate('/laba-tracked')}
        className="flex flex-col items-center gap-[7px]"
      >
        <div className={`w-[103px] h-[100px] rounded-[20px] border border-white/30 flex items-center justify-center transition-colors ${
          isActive('/laba-tracked') || isActive('/laba-no-tracked') ? 'bg-white/20' : 'bg-white/10'
        }`}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="20" r="10" stroke="white" strokeWidth="3"/>
            <path d="M15 45C15 37 22 32 30 32C38 32 45 37 45 45" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-white text-[19px] font-['Gotham_Pro'] font-medium">следить</span>
      </button>

      {/* избранное */}
      <button
        onClick={() => navigate('/laba-favorites')}
        className="flex flex-col items-center gap-[7px]"
      >
        <div className={`w-[103px] h-[99px] rounded-[20px] border border-white/30 flex items-center justify-center transition-colors ${
          isActive('/laba-favorites') ? 'bg-white/20' : 'bg-white/10'
        }`}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <path d="M30 15L35 25L46 27L38 35L40 46L30 41L20 46L22 35L14 27L25 25L30 15Z" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-white text-[19px] font-['Gotham_Pro'] font-medium">избранное</span>
      </button>

      {/* пополнить */}
      <button
        onClick={() => navigate('/metacoins')}
        className="flex flex-col items-center gap-[7px]"
      >
        <div className="w-[103px] h-[105px] rounded-[20px] bg-white/10 border border-white/30 flex items-center justify-center">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="18" stroke="white" strokeWidth="3"/>
            <path d="M30 20V40M20 30H40" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-white text-[19px] font-['Gotham_Pro'] font-medium">пополнить</span>
      </button>
    </div>
  );
}
