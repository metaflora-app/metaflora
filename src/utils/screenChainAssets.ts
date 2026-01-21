// Static imports of all screen chain assets (no dynamic imports to avoid build errors)

// Academy chain assets
import academyAboutBg from '../assets/about-screens/фон академия.png';
import academyCoursesBg from '../assets/academy-courses/фон академия.png';
import academyStudyButton from '../assets/academy-courses/кнопка изучить.png';
import academyPeopleImg from '../assets/academy-courses/люди на фоне.png';
import academyMaterialsButton from '../assets/academy-lesson/кнопка получить материалы.png';

// Laba chain assets
import labaAboutBg from '../assets/about-screens/фон лаба.png';
import labaCardImage from '../assets/laba-main/картинка в карточке промпта.png';
import labaNewBadge from '../assets/laba-main/плашка новое.png';
import labaAnalysisBtn from '../assets/laba-main/кнопка анализ.png';
import labaReturnBtn from '../assets/laba-main-buttons/кнопка вернуть.png';
import labaSearchBadge from '../assets/laba-main-buttons/плашка начать поиск.png';
import labaTrackingWindow from '../assets/laba-no-tracked/окошко отслеживание.png';
import labaOpenReelsBtn from '../assets/laba-analysis/кнопка открыть рилс.png';
import labaFollowBtn from '../assets/laba-analysis/кнопка следить.png';
import labaStartAnalysisBtn from '../assets/laba-analysis/поменьше кнопка начать анализ.png';
import labaCreateScenarioBtn from '../assets/laba-analysis/поменьше кнопка создать сценарий.png';

// Tsekh chain assets
import tsekhAboutBg from '../assets/about-screens/фон цех.png';
import tsekhPromptBg from '../assets/prompt-first/фон цех.png';
import tsekhTopChoiceBtn from '../assets/prompt-first/кнопка топ-выбор активная.png';
import tsekhNewBadge from '../assets/prompt-first/новое в цехе.png';
import tsekhCopyBtn from '../assets/prompt-card/кнопка скопировать.png';

// Poligon chain assets
import poligonAboutBg from '../assets/about-screens/фон полигон.png';
import poligonArticlesBg from '../assets/poligon-articles/фон полигон.png';
import poligonPlusBtn from '../assets/article/кнопка плюс.png';
import poligonDownloadBtn from '../assets/article/кнопка скачать файлы.png';

export const SCREEN_CHAIN_ASSETS = {
  academy: [
    academyAboutBg,
    academyCoursesBg,
    academyStudyButton,
    academyPeopleImg,
    academyMaterialsButton,
  ],
  laba: [
    labaAboutBg,
    labaCardImage,
    labaNewBadge,
    labaAnalysisBtn,
    labaReturnBtn,
    labaSearchBadge,
    labaTrackingWindow,
    labaOpenReelsBtn,
    labaFollowBtn,
    labaStartAnalysisBtn,
    labaCreateScenarioBtn,
  ],
  tsekh: [
    tsekhAboutBg,
    tsekhPromptBg,
    tsekhTopChoiceBtn,
    tsekhNewBadge,
    tsekhCopyBtn,
  ],
  poligon: [
    poligonAboutBg,
    poligonArticlesBg,
    poligonPlusBtn,
    poligonDownloadBtn,
  ],
};

const chainLoadStatus: Record<string, boolean> = {};

export const preloadScreenChain = (chainName: keyof typeof SCREEN_CHAIN_ASSETS): Promise<void> => {
  if (chainLoadStatus[chainName]) {
    return Promise.resolve();
  }

  const assets = SCREEN_CHAIN_ASSETS[chainName];
  
  const promises = assets.map((src) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = src;
    });
  });

  return Promise.all(promises).then(() => {
    chainLoadStatus[chainName] = true;
  });
};
