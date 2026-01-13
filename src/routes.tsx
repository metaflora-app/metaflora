import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SplashScreen } from './screens/splash';
import { WelcomeScreen } from './screens/welcome';
import { TourVideoScreen } from './screens/tour-video';
import { DemoAccessScreen } from './screens/demo-access';
import { PricingScreen } from './screens/pricing';
import { PrivacyPolicyScreen } from './screens/privacy-policy';
import { MarketingConsentScreen } from './screens/marketing-consent';
import { MainDashboardFreeScreen } from './screens/main-dashboard-free';
import { MainDashboardPremiumScreen } from './screens/main-dashboard-premium';
import { AboutPromptScreen } from './screens/about-prompt';
import { AboutAcademyScreen } from './screens/about-academy';
import { AboutLabaScreen } from './screens/about-laba';
import { AboutPoligonScreen } from './screens/about-poligon';
import { AcademyCoursesAllScreen } from './screens/academy-courses-all';
import { AcademyLessonVideoScreen } from './screens/academy-lesson-video';
import { AcademyCourseSystemScreen } from './screens/academy-course-system';
import { AcademyLessonMaterialsScreen } from './screens/academy-lesson-materials';
import { PromptCardScreen } from './screens/prompt-card';

// Temporary placeholder component for deleted screens
const PlaceholderScreen = ({ name }: { name: string }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100vh',
    background: '#000',
    color: '#fff',
    fontSize: '24px',
    fontFamily: 'system-ui'
  }}>
    {name} - будет воссоздан через Figma MCP
  </div>
);

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
    element: <PlaceholderScreen name="Metacoins Screen" />,
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
    element: <PlaceholderScreen name="Prompt First" />,
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
    element: <PlaceholderScreen name="Article" />,
  },
  {
    path: '/poligon-articles-all',
    element: <PlaceholderScreen name="Poligon Articles All" />,
  },

  // Laba section
  {
    path: '/laba-main',
    element: <PlaceholderScreen name="Laba Main" />,
  },
  {
    path: '/laba-search',
    element: <PlaceholderScreen name="Laba Search" />,
  },
  {
    path: '/laba-favorites',
    element: <PlaceholderScreen name="Laba Favorites" />,
  },
  {
    path: '/laba-tracked',
    element: <PlaceholderScreen name="Laba Tracked" />,
  },
  {
    path: '/laba-no-tracked',
    element: <PlaceholderScreen name="Laba No Tracked" />,
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
