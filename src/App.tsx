import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { SplashScreen } from './screens/splash';

function App() {
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
  }, []);

  return <SplashScreen />;
}

export default App;

