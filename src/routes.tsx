import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SplashScreen } from './screens/splash';

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
    element: <PlaceholderScreen name="Metacoins Screen" />,
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
    element: <PlaceholderScreen name="Prompt First" />,
  },
  {
    path: '/prompt-card',
    element: <PlaceholderScreen name="Prompt Card" />,
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
    element: <PlaceholderScreen name="Privacy Policy" />,
  },
  {
    path: '/marketing-consent',
    element: <PlaceholderScreen name="Marketing Consent" />,
  },
]);
