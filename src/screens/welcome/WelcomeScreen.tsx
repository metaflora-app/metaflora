import { useNavigate } from 'react-router-dom';
import welcomeFullPng from '../../assets/screens/welcome-full.png';

export const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020101]">
      {/* PNG на весь экран БЕЗ масштабирования */}
      <img
        src={welcomeFullPng}
        alt="МЕТАФЛОРА"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Невидимые кликабельные зоны - позиции в процентах от экрана */}
      
      {/* Кнопка "экскурсия по платформе" */}
      <button
        onClick={() => navigate('/tour-video')}
        className="absolute"
        style={{
          left: '12.5%',
          bottom: '23%',
          width: '75%',
          height: '5.5%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="экскурсия по платформе"
      />

      {/* Кнопка "попробовать бесплатно" */}
      <button
        onClick={() => navigate('/demo-access')}
        className="absolute"
        style={{
          left: '12.5%',
          bottom: '16.5%',
          width: '75%',
          height: '5.5%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="попробовать бесплатно"
      />
    </div>
  );
};
