import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initTelegram } from './app/telegram/initTelegram';
import { UIStateProvider } from './contexts/UIStateContext';

// Initialize Telegram Mini App
initTelegram();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UIStateProvider>
      <App />
    </UIStateProvider>
  </React.StrictMode>,
);

