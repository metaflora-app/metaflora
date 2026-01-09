import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Global navigation hook for МЕТАФЛОРА* app
 * Implements navigation rules from NAVIGATION.md
 */
export function useAppNavigation() {
  const navigate = useNavigate();

  // Global actions
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const goHome = useCallback(() => {
    navigate('/main-dashboard-premium');
  }, [navigate]);

  const openSupport = useCallback(() => {
    window.open('https://t.me/mishchenko_is', '_blank');
  }, []);

  const openSocials = useCallback(() => {
    window.open('https://t.me/mishchenko_is', '_blank');
  }, []);

  const goToPrivacyPolicy = useCallback(() => {
    navigate('/privacy-policy');
  }, [navigate]);

  const goToMarketingConsent = useCallback(() => {
    navigate('/marketing-consent');
  }, [navigate]);

  // Onboarding flow
  const goToTourVideo = useCallback(() => {
    navigate('/tour-video');
  }, [navigate]);

  const goToDemoAccess = useCallback(() => {
    navigate('/demo-access');
  }, [navigate]);

  const goToPricing = useCallback(() => {
    navigate('/pricing');
  }, [navigate]);

  const goToMainDashboardFree = useCallback(() => {
    navigate('/main-dashboard-free');
  }, [navigate]);

  const goToMainDashboardPremium = useCallback(() => {
    navigate('/main-dashboard-premium');
  }, [navigate]);

  const goToMetacoins = useCallback(() => {
    navigate('/metacoins');
  }, [navigate]);

  // Service intro screens (first-time)
  const goToServiceIntro = useCallback((service: 'academy' | 'prompt' | 'laba' | 'poligon') => {
    const storageKey = `${service}_intro_seen`;
    const hasSeenIntro = localStorage.getItem(storageKey) === 'true';

    if (hasSeenIntro) {
      // Go directly to main screen
      switch (service) {
        case 'academy':
          navigate('/academy-courses-all');
          break;
        case 'prompt':
          navigate('/prompt-first');
          break;
        case 'laba':
          navigate('/laba-main');
          break;
        case 'poligon':
          navigate('/poligon-articles-all');
          break;
      }
    } else {
      // Show intro first
      navigate(`/about-${service}`);
    }
  }, [navigate]);

  const completeServiceIntro = useCallback((
    service: 'academy' | 'prompt' | 'laba' | 'poligon',
    redirectPath: string
  ) => {
    localStorage.setItem(`${service}_intro_seen`, 'true');
    navigate(redirectPath);
  }, [navigate]);

  // Prompt section
  const goToPromptFirst = useCallback(() => {
    navigate('/prompt-first');
  }, [navigate]);

  const goToPromptCard = useCallback(() => {
    navigate('/prompt-card');
  }, [navigate]);

  // Academy section
  const goToAcademyCourses = useCallback(() => {
    navigate('/academy-courses-all');
  }, [navigate]);

  const goToAcademyCourse = useCallback((course: 'system' | 'art' | 'prompting' | 'automation') => {
    navigate(`/academy-course-${course}`);
  }, [navigate]);

  const goToAcademyLessonVideo = useCallback((lessonId?: string) => {
    const path = lessonId ? `/academy-lesson-video?lesson=${lessonId}` : '/academy-lesson-video';
    navigate(path);
  }, [navigate]);

  const goToAcademyLessonMaterials = useCallback(() => {
    navigate('/academy-lesson-materials');
  }, [navigate]);

  // Poligon section
  const goToPoligonArticles = useCallback(() => {
    navigate('/poligon-articles-all');
  }, [navigate]);

  const goToArticle = useCallback(() => {
    navigate('/article');
  }, [navigate]);

  // Laba section
  const goToLabaMain = useCallback(() => {
    navigate('/laba-main');
  }, [navigate]);

  const goToLabaSearch = useCallback(() => {
    navigate('/laba-search');
  }, [navigate]);

  const goToLabaFavorites = useCallback(() => {
    navigate('/laba-favorites');
  }, [navigate]);

  const goToLabaTracked = useCallback(() => {
    navigate('/laba-tracked');
  }, [navigate]);

  const goToLabaNoTracked = useCallback(() => {
    navigate('/laba-no-tracked');
  }, [navigate]);

  const goToLabaAnalysis = useCallback(() => {
    navigate('/laba-analysis');
  }, [navigate]);

  const goToLabaAnalysisFull = useCallback(() => {
    navigate('/laba-analysis-full');
  }, [navigate]);

  return {
    // Global
    goBack,
    goHome,
    openSupport,
    openSocials,
    goToPrivacyPolicy,
    goToMarketingConsent,

    // Onboarding
    goToTourVideo,
    goToDemoAccess,
    goToPricing,
    goToMainDashboardFree,
    goToMainDashboardPremium,
    goToMetacoins,

    // Service intro
    goToServiceIntro,
    completeServiceIntro,

    // Prompt
    goToPromptFirst,
    goToPromptCard,

    // Academy
    goToAcademyCourses,
    goToAcademyCourse,
    goToAcademyLessonVideo,
    goToAcademyLessonMaterials,

    // Poligon
    goToPoligonArticles,
    goToArticle,

    // Laba
    goToLabaMain,
    goToLabaSearch,
    goToLabaFavorites,
    goToLabaTracked,
    goToLabaNoTracked,
    goToLabaAnalysis,
    goToLabaAnalysisFull,
  };
}
