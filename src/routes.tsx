import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { SplashScreen } from './screens/splash';
import { WelcomeScreen } from './screens/welcome';
import { TourVideoScreen } from './screens/tour-video';
import { DemoAccessScreen } from './screens/demo-access';
import { PricingScreen } from './screens/pricing';
import { MainDashboardFreeScreen } from './screens/main-dashboard-free';
import { MainDashboardPremiumScreen } from './screens/main-dashboard-premium';
import { AboutPromptScreen } from './screens/about-prompt';
import { AboutAcademyScreen } from './screens/about-academy';
import { AboutLabaScreen } from './screens/about-laba';
import { AboutPoligonScreen } from './screens/about-poligon';
import { AcademyCoursesAllScreen } from './screens/academy-courses-all';
import { AcademyCourseSystemScreen } from './screens/academy-course-system';
import { AcademyLessonVideoScreen } from './screens/academy-lesson-video';
import { AcademyLessonMaterialsScreen } from './screens/academy-lesson-materials';
import { ArticleScreen } from './screens/article';
import { PrivacyPolicyScreen } from './screens/privacy-policy';
import { MarketingConsentScreen } from './screens/marketing-consent';
import { PromptCardScreen } from './screens/prompt-card';
import { PromptFirstScreen } from './screens/prompt-first';
import { PoligonArticlesAllScreen } from './screens/poligon-articles-all';
import { LabaSearchScreen } from './screens/laba-search';
import { LabaNoTrackedScreen } from './screens/laba-no-tracked';
import { LabaLoadingScreen } from './screens/laba-loading';
import { LabaSearchAccountScreen } from './screens/laba-search-account';
import { LabaMainScreen } from './screens/laba-main';
import { LabaTrackedScreen } from './screens/laba-tracked';
import { MetacoinsScreen } from './screens/metacoins';

// Temporary placeholder component for deleted screens
const PlaceholderScreen = ({ name }: { name: string }) => {
  const navigate = useNavigate();
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      background: '#000',
      color: '#fff',
      fontSize: '24px',
      fontFamily: 'system-ui',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div>{name} - будет воссоздан через Figma MCP</div>
      {name === "About Poligon" && (
        <button 
          onClick={() => navigate('/poligon-articles-all')}
          style={{
            padding: '12px 24px',
            borderRadius: '62px',
            backgroundColor: 'rgba(0,0,0,0.9)',
            border: '4px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(50px)',
            color: 'white',
            fontSize: '20px',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          перейти к сервису
        </button>
      )}
      {name === "About Laba" && (
        <button 
          onClick={() => navigate('/laba-loading')}
          style={{
            padding: '12px 24px',
            borderRadius: '62px',
            backgroundColor: 'rgba(0,0,0,0.9)',
            border: '4px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(50px)',
            color: 'white',
            fontSize: '20px',
            fontFamily: 'Gotham Pro, sans-serif',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          перейти к сервису
        </button>
      )}
    </div>
  );
};

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
  {
    path: '/poligon-articles-all',
    element: <PoligonArticlesAllScreen />,
  },
  {
    path: '/laba-loading',
    element: <LabaLoadingScreen />,
  },
  {
    path: '/laba-search',
    element: <LabaSearchScreen />,
  },
  {
    path: '/laba-no-tracked',
    element: <LabaNoTrackedScreen />,
  },
  {
    path: '/laba-search-account',
    element: <LabaSearchAccountScreen />,
  },
  {
    path: '/metacoins',
    element: <MetacoinsScreen />,
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
    element: <PlaceholderScreen name="Academy Course Art" />,
  },
  {
    path: '/academy-course-prompting',
    element: <PlaceholderScreen name="Academy Course Prompting" />,
  },
  {
    path: '/academy-course-automation',
    element: <PlaceholderScreen name="Academy Course Automation" />,
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
    element: <ArticleScreen />,
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
    path: '/laba-loading',
    element: <LabaLoadingScreen />,
  },
  {
    path: '/laba-favorites',
    element: <PlaceholderScreen name="Laba Favorites" />,
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
    path: '/laba-search-account',
    element: <LabaSearchAccountScreen />,
  },
  {
    path: '/laba-analysis',
    element: <PlaceholderScreen name="Laba Analysis" />,
  },
  {
    path: '/laba-analysis-full',
    element: <PlaceholderScreen name="Laba Analysis Full" />,
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
