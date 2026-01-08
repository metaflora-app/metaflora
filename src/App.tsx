import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { SplashScreen } from './screens/splash';
import { WelcomeScreen } from './screens/welcome/WelcomeScreen';
import { TourScreen } from './screens/welcome/TourScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [screen, setScreen] = useState<'welcome' | 'tour'>('welcome');

  useEffect(() => {
    // Инициализация Telegram WebApp
    WebApp.ready();
    
    // Раскрываем приложение на весь экран
    WebApp.expand();
    
    // Отключаем вертикальные свайпы (чтобы не закрывалось приложение)
    WebApp.disableVerticalSwipes();
    
    // Опционально: устанавливаем цвет header bar
    WebApp.setHeaderColor('#000000');
    WebApp.setBackgroundColor('#000000');

    // Таймер для показа сплэш-экрана
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (screen === 'tour') {
    return <TourScreen />;
  }

  return <WelcomeScreen onGoTour={() => setScreen('tour')} />;
}

export default App;
