import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import welcomeFullPng from '../../assets/screens/welcome-full.png';

// Размеры фрейма Figma
const DESIGN_W = 1180;
const DESIGN_H = 2550;

export const WelcomeScreen = () => {
  const navigate = useNavigate();
  const vw = window.innerWidth;
  
  // Масштаб строго по ширине
  const scale = useMemo(() => vw / DESIGN_W, [vw]);
  const scaledHeight = DESIGN_H * scale;

  return (
    <div 
      className="relative w-full bg-[#020101]"
      style={{ height: `${scaledHeight}px`, overflow: 'hidden' }}
    >
      {/* Полный PNG экрана */}
      <img
        src={welcomeFullPng}
        alt="МЕТАФЛОРА"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />

      {/* Невидимые кликабельные зоны поверх PNG */}
      
      {/* Кнопка "экскурсия по платформе" (x=128 y=1899 w=892 h=139) */}
      <button
        onClick={() => navigate('/tour-video')}
        style={{
          position: 'absolute',
          left: 128 * scale,
          top: 1899 * scale,
          width: 892 * scale,
          height: 139 * scale,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="экскурсия по платформе"
      />

      {/* Кнопка "попробовать бесплатно" (x=128 y=2057 w=892 h=139) */}
      <button
        onClick={() => navigate('/demo-access')}
        style={{
          position: 'absolute',
          left: 128 * scale,
          top: 2057 * scale,
          width: 892 * scale,
          height: 139 * scale,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="попробовать бесплатно"
      />
    </div>
  );
};
