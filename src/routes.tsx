import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SplashScreen } from './screens/splash';
import { WelcomeScreen } from './screens/welcome';
import TourVideoScreen from './screens/tour-video';
import { DemoAccessScreen } from './screens/demo-access';
import PricingScreen from './screens/pricing';
import MainDashboardFreeScreen from './screens/main-dashboard-free';
import MainDashboardPremiumScreen from './screens/main-dashboard-premium';
import MetacoinsScreen from './screens/metacoins';

// Intro screens
import AboutPromptScreen from './screens/about-prompt';
import AboutAcademyScreen from './screens/about-academy';
import AboutLabaScreen from './screens/about-laba';
import AboutPoligonScreen from './screens/about-poligon';

// Prompt section
import PromptFirstScreen from './screens/prompt-first';
import PromptCardScreen from './screens/prompt-card';

// Academy section
import AcademyCoursesAllScreen from './screens/academy-courses-all';
import AcademyCourseSystemScreen from './screens/academy-course-system';
import AcademyCourseArtScreen from './screens/academy-course-art';
import AcademyCoursePromptingScreen from './screens/academy-course-prompting';
import AcademyCourseAutomationScreen from './screens/academy-course-automation';
import AcademyLessonVideoScreen from './screens/academy-lesson-video';
import AcademyLessonMaterialsScreen from './screens/academy-lesson-materials';

// Poligon section
import ArticlePartOneScreen from './screens/article-part-one';
import PoligonArticlesAllScreen from './screens/poligon-articles-all';

// Laba section
import LabaMainScreen from './screens/laba-main';
import LabaSearchScreen from './screens/laba-search';
import LabaFavoritesScreen from './screens/laba-favorites';
import LabaTrackedScreen from './screens/laba-tracked';
import LabaNoTrackedScreen from './screens/laba-no-tracked';
import LabaAnalysisScreen from './screens/laba-analysis';
import LabaAnalysisFullScreen from './screens/laba-analysis-full';

// Legal
import PrivacyPolicyScreen from './screens/privacy-policy';
import MarketingConsentScreen from './screens/marketing-consent';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/splash" replace />,
  },
  {
    path: '/splash',
    element: <SplashScreen />,
  },
  {
    path: '/welcome',
    element: <WelcomeScreen />,
  },
  {
    path: '/tour-video',
    element: <TourVideoScreen />,
  },
  {
    path: '/demo-access',
    element: <DemoAccessScreen />,
  },
  {
    path: '/pricing',
    element: <PricingScreen />,
  },
  {
    path: '/main-dashboard-free',
    element: <MainDashboardFreeScreen />,
  },
  {
    path: '/main-dashboard-premium',
    element: <MainDashboardPremiumScreen />,
  },
  {
    path: '/metacoins',
    element: <MetacoinsScreen />,
  },
  
  // Intro screens
  {
    path: '/about-prompt',
    element: <AboutPromptScreen />,
  },
  {
    path: '/about-academy',
    element: <AboutAcademyScreen />,
  },
  {
    path: '/about-laba',
    element: <AboutLabaScreen />,
  },
  {
    path: '/about-poligon',
    element: <AboutPoligonScreen />,
  },

  // Prompt section
  {
    path: '/prompt-first',
    element: <PromptFirstScreen />,
  },
  {
    path: '/prompt-card',
    element: <PromptCardScreen />,
  },

  // Academy section
  {
    path: '/academy-courses-all',
    element: <AcademyCoursesAllScreen />,
  },
  {
    path: '/academy-course-system',
    element: <AcademyCourseSystemScreen />,
  },
  {
    path: '/academy-course-art',
    element: <AcademyCourseArtScreen />,
  },
  {
    path: '/academy-course-prompting',
    element: <AcademyCoursePromptingScreen />,
  },
  {
    path: '/academy-course-automation',
    element: <AcademyCourseAutomationScreen />,
  },
  {
    path: '/academy-lesson-video',
    element: <AcademyLessonVideoScreen />,
  },
  {
    path: '/academy-lesson-materials',
    element: <AcademyLessonMaterialsScreen />,
  },

  // Poligon section
  {
    path: '/article',
    element: <ArticlePartOneScreen />,
  },
  {
    path: '/poligon-articles-all',
    element: <PoligonArticlesAllScreen />,
  },

  // Laba section
  {
    path: '/laba-main',
    element: <LabaMainScreen />,
  },
  {
    path: '/laba-search',
    element: <LabaSearchScreen />,
  },
  {
    path: '/laba-favorites',
    element: <LabaFavoritesScreen />,
  },
  {
    path: '/laba-tracked',
    element: <LabaTrackedScreen />,
  },
  {
    path: '/laba-no-tracked',
    element: <LabaNoTrackedScreen />,
  },
  {
    path: '/laba-analysis',
    element: <LabaAnalysisScreen />,
  },
  {
    path: '/laba-analysis-full',
    element: <LabaAnalysisFullScreen />,
  },

  // Legal
  {
    path: '/privacy-policy',
    element: <PrivacyPolicyScreen />,
  },
  {
    path: '/marketing-consent',
    element: <MarketingConsentScreen />,
  },
]);
