// ================================================
// ТИПЫ ДЛЯ ЛАБЫ (Instagram Reels Analyzer)
// Дата: 2026-01-30
// Версия: 1.0
// ================================================

/**
 * Instagram Reel (найденный через поиск или из отслеживаемого аккаунта)
 */
export interface Reel {
  id: string;
  instagramReelId: string;
  reelUrl: string;
  coverImageUrl: string;
  videoUrl: string;
  caption: string | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  publishedAt: string; // ISO timestamp
  viralityScore: number | null;
  isNew: boolean;
  accountUsername: string;
  accountFollowers: number;
  accountProfilePicUrl?: string | null; // Аватарка аккаунта
  trackedAccountId?: string | null; // Присутствует если reel из отслеживаемого аккаунта
}

/**
 * Instagram аккаунт (результат поиска перед отслеживанием)
 */
export interface InstagramAccount {
  username: string;
  userId: string;
  followersCount: number;
  profilePhotoUrl: string;
}

/**
 * Отслеживаемый Instagram аккаунт
 */
export interface TrackedAccount {
  id: string;
  username: string;
  followersCount: number;
  profilePhotoUrl: string;
  trackedSince: string; // ISO timestamp
  reelsCount: number; // Количество reels в БД
  newReelsCount: number; // Количество новых reels (is_new = true)
}

/**
 * ИИ-анализ reel
 */
export interface Analysis {
  id: string;
  reelId: string;
  userId: number;
  viralityScore: number;
  hookText: string;
  transcription: string;
  videoSummary: string;
  analyzedAt: string; // ISO timestamp
}

/**
 * Сгенерированный сценарий
 */
export interface Scenario {
  id: string;
  analysisId: string;
  userId: number;
  text: string;
  createdAt: string; // ISO timestamp
}

/**
 * Фильтры для reels
 */
export interface ReelFilters {
  sortBy?: 'views' | 'likes' | 'comments' | 'date' | 'virality';
  sortOrder?: 'asc' | 'desc';
  dateRange?: '7d' | '14d' | '30d' | '6m' | '1y';
  language?: 'ru' | 'en' | 'es' | 'tr' | 'fr';
  viralityMin?: number;
  viralityMax?: number;
  accountSize?: '0-10k' | '10k-100k' | '100k-300k' | '300k-1m' | '1m+';
}

/**
 * Категории топ reels
 */
export type TopReelCategory = 'нейросети' | 'маркетинг' | 'контент';

/**
 * Настройки уведомлений
 */
export interface NotificationSettings {
  id: string;
  userId: number;
  enabled: boolean;
  updatedAt: string; // ISO timestamp
}

/**
 * Ответ API: Поиск reels
 */
export interface SearchReelsResponse {
  success: boolean;
  reels: Reel[];
  count: number;
  error?: string;
}

/**
 * Ответ API: Топ reels
 */
export interface TopReelsResponse {
  success: boolean;
  reels: Reel[];
  error?: string;
}

/**
 * Ответ API: Анализ reel
 */
export interface AnalyzeReelResponse {
  success: boolean;
  analysis: Analysis;
  error?: string;
}

/**
 * Ответ API: Генерация сценария
 */
export interface GenerateScenarioResponse {
  success: boolean;
  scenario: Scenario;
  error?: string;
}

/**
 * Ответ API: Поиск аккаунта
 */
export interface SearchAccountResponse {
  success: boolean;
  account: InstagramAccount;
  error?: string;
}

/**
 * Ответ API: Начать отслеживание
 */
export interface TrackAccountResponse {
  success: boolean;
  accountId: string;
  reelsAdded: number;
  error?: string;
}

/**
 * Ответ API: Отслеживаемые аккаунты
 */
export interface TrackedAccountsResponse {
  success: boolean;
  accounts: TrackedAccount[];
  error?: string;
}

/**
 * Ответ API: Reels отслеживаемого аккаунта
 */
export interface TrackedReelsResponse {
  success: boolean;
  reels: Reel[];
  error?: string;
}

/**
 * Ответ API: Убрать из отслеживания
 */
export interface UntrackAccountResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Ответ API: Избранное (добавить/убрать)
 */
export interface ToggleFavoriteResponse {
  success: boolean;
  isFavorite: boolean;
  error?: string;
}

/**
 * Ответ API: Получить избранные
 */
export interface FavoritesResponse {
  success: boolean;
  reels: Reel[];
  error?: string;
}

/**
 * Стоимость операций (в метакоинах)
 */
export const LABA_COSTS = {
  SEARCH_REELS: 25,
  ANALYZE_REEL: 100,
  GENERATE_SCENARIO: 50,
  TRACK_ACCOUNT: 150,
} as const;

/**
 * Лимиты по тарифам
 */
export const LABA_LIMITS = {
  FREE: {
    TRACKED_ACCOUNTS: 0,
    AI_ANALYSIS: 0,
    SCENARIO_GENERATION: 0,
    SEARCH_QUERIES: 0,
  },
  PREMIUM_5000: {
    TRACKED_ACCOUNTS: 20,
    AI_ANALYSIS: 200,
    SCENARIO_GENERATION: 130,
    SEARCH_QUERIES: 50,
  },
  PREMIUM_25000: {
    TRACKED_ACCOUNTS: 100,
    AI_ANALYSIS: 500,
    SCENARIO_GENERATION: 250,
    SEARCH_QUERIES: 200,
  },
} as const;

/**
 * Категории контента для топ reels
 */
export const TOP_REEL_CATEGORIES: TopReelCategory[] = [
  'нейросети',
  'маркетинг',
  'контент',
];

/**
 * Хэштеги для каждой категории (для парсинга топ reels)
 */
export const CATEGORY_HASHTAGS: Record<TopReelCategory, string[]> = {
  'нейросети': ['нейросети', 'ai', 'искусственныйинтеллект', 'нейросеть'],
  'маркетинг': ['маркетинг', 'бизнес', 'продажи', 'реклама'],
  'контент': ['контент', 'креатор', 'создательконтента', 'контентмейкер'],
};
