import { useNavigate } from 'react-router-dom';
import fullScreen from '../../assets/welcome/full-screen.png';

export const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-screen bg-black overflow-auto">
      {/* PNG экрана из Figma */}
      <img 
        src={fullScreen} 
        alt="Welcome"
        className="w-full h-auto"
      />
      
      {/* Невидимые кнопки поверх */}
      <button
        onClick={() => navigate('/tour-video')}
        className="absolute"
        style={{
          left: '11%',
          top: '74.5%',
          width: '78%',
          height: '5.5%',
          background: 'transparent',
          border: 'none',
        }}
      />
      
      <button
        onClick={() => navigate('/demo-access')}
        className="absolute"
        style={{
          left: '11%',
          top: '80.7%',
          width: '78%',
          height: '5.5%',
          background: 'transparent',
          border: 'none',
        }}
      />
      
      <button
        onClick={() => window.open('https://t.me/mishchenko_is', '_blank')}
        className="absolute"
        style={{
          right: '11%',
          top: '9.3%',
          width: '17.4%',
          height: '3.1%',
          background: 'transparent',
          border: 'none',
        }}
      />
    </div>
  );
};
