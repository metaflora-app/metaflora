import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { SplashScreen } from './screens/splash';
import { PromptCardScreen } from './screens/prompt-card';
import { PromptFirstScreen } from './screens/prompt-first';
import { PoligonArticlesAllScreen } from './screens/poligon-articles-all';
import { LabaSearchScreen } from './screens/laba-search';
import { LabaNoTrackedScreen } from './screens/laba-no-tracked';
import { LabaLoadingScreen } from './screens/laba-loading';
import { LabaSearchAccountScreen } from './screens/laba-search-account';
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
    element: <PlaceholderScreen name="Welcome Screen" />,
  },
  {
    path: '/tour-video',
    element: <PlaceholderScreen name="Tour Video Screen" />,
  },
  {
    path: '/demo-access',
    element: <PlaceholderScreen name="Demo Access Screen" />,
  },
  {
    path: '/pricing',
    element: <PlaceholderScreen name="Pricing Screen" />,
  },
  {
    path: '/main-dashboard-free',
    element: <PlaceholderScreen name="Main Dashboard Free" />,
  },
  {
    path: '/main-dashboard-premium',
    element: <PlaceholderScreen name="Main Dashboard Premium" />,
  },
  {
    path: '/metacoins',
    element: <MetacoinsScreen />,
  },
  
  // Intro screens
  {
    path: '/about-prompt',
    element: <PlaceholderScreen name="About Prompt" />,
  },
  {
    path: '/about-academy',
    element: <PlaceholderScreen name="About Academy" />,
  },
  {
    path: '/about-laba',
    element: <PlaceholderScreen name="About Laba" />,
  },
  {
    path: '/about-poligon',
    element: <PlaceholderScreen name="About Poligon" />,
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
    element: <PlaceholderScreen name="Academy Courses All" />,
  },
  {
    path: '/academy-course-system',
    element: <PlaceholderScreen name="Academy Course System" />,
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
    element: <PlaceholderScreen name="Academy Lesson Video" />,
  },
  {
    path: '/academy-lesson-materials',
    element: <PlaceholderScreen name="Academy Lesson Materials" />,
  },

  // Poligon section
  {
    path: '/article',
    element: <PlaceholderScreen name="Article" />,
  },
  {
    path: '/poligon-articles-all',
    element: <PoligonArticlesAllScreen />,
  },

  // Laba section
  {
    path: '/laba-main',
    element: <PlaceholderScreen name="Laba Main" />,
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
    element: <PlaceholderScreen name="Laba Tracked" />,
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
    element: <PlaceholderScreen name="Privacy Policy" />,
  },
  {
    path: '/marketing-consent',
    element: <PlaceholderScreen name="Marketing Consent" />,
  },
]);
