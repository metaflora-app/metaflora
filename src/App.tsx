import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { SplashScreen } from './screens/splash';
import { WelcomeScreen } from './screens/welcome';

function App() {
  const [isLoading, setIsLoading] = useState(true);

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

    // Показываем splash screen 2.5 секунды, потом переходим к welcome screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Показываем splash screen во время загрузки
  if (isLoading) {
    return <SplashScreen />;
  }

  // После загрузки показываем welcome screen
  return <WelcomeScreen />;
}

export default App;

