import { markAboutIntroSeen } from './supabase';

export type AboutIntroService = 'academy' | 'laba' | 'prompt' | 'poligon';

const ABOUT_INTRO_TARGETS: Record<AboutIntroService, string> = {
  academy: '/academy-courses-all',
  laba: '/laba-search',
  prompt: '/prompt-first',
  poligon: '/poligon-articles-all',
};

export async function completeAboutIntro(
  service: AboutIntroService,
  navigate: (path: string) => void,
) {
  await markAboutIntroSeen(service);
  navigate(ABOUT_INTRO_TARGETS[service]);
}
