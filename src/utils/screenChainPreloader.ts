// Preload screen chains for each service card

// Define screen chains for each service
const SCREEN_CHAINS = {
  academy: [
    // Academy chain
    import('../assets/about-screens/фон академия.png'),
    import('../assets/academy-courses/фон академия.png'),
    import('../assets/academy-courses/кнопка изучить.png'),
    import('../assets/academy-courses/люди на фоне.png'),
    import('../assets/academy-lesson/кнопка получить материалы.png'),
  ],
  laba: [
    // Laba chain
    import('../assets/about-screens/фон лаба.png'),
    import('../assets/laba-main/картинка в карточке промпта.png'),
    import('../assets/laba-main/плашка новое.png'),
    import('../assets/laba-main/кнопка анализ.png'),
    import('../assets/laba-main-buttons/кнопка вернуть.png'),
    import('../assets/laba-main-buttons/плашка начать поиск.png'),
    import('../assets/laba-no-tracked/окошко отслеживание.png'),
    import('../assets/laba-analysis/кнопка открыть рилс.png'),
    import('../assets/laba-analysis/кнопка следить.png'),
    import('../assets/laba-analysis/поменьше кнопка начать анализ.png'),
    import('../assets/laba-analysis/поменьше кнопка создать сценарий.png'),
  ],
  tsekh: [
    // Tsekh (prompt) chain
    import('../assets/about-screens/фон цех.png'),
    import('../assets/prompt-first/фон цех.png'),
    import('../assets/prompt-first/кнопка топ-выбор активная.png'),
    import('../assets/prompt-first/новое в цехе.png'),
    import('../assets/prompt-card/кнопка скопировать.png'),
  ],
  poligon: [
    // Poligon chain
    import('../assets/about-screens/фон полигон.png'),
    import('../assets/poligon-articles/фон полигон.png'),
    import('../assets/article/кнопка плюс.png'),
    import('../assets/article/кнопка скачать файлы.png'),
  ],
  chat: [
    // Chat chain (if exists)
    import('../assets/main-dashboard/фон чат.png'),
  ],
};

const chainLoadStatus: Record<string, boolean> = {};

export const preloadScreenChain = async (chainName: keyof typeof SCREEN_CHAINS): Promise<void> => {
  if (chainLoadStatus[chainName]) {
    return Promise.resolve();
  }

  const chain = SCREEN_CHAINS[chainName];
  
  try {
    await Promise.all(chain);
    chainLoadStatus[chainName] = true;
  } catch (error) {
    console.error(`Failed to preload ${chainName} chain:`, error);
    chainLoadStatus[chainName] = true; // Mark as loaded anyway to not block navigation
  }
};

export const isChainPreloaded = (chainName: keyof typeof SCREEN_CHAINS): boolean => {
  return chainLoadStatus[chainName] || false;
};
