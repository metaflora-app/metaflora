// ================================================
// API ФУНКЦИИ ДЛЯ ЛАБЫ (Instagram Reels Analyzer)
// Дата: 2026-01-30
// Версия: 1.0
// ================================================

import {
  Reel,
  InstagramAccount,
  TrackedAccount,
  Analysis,
  Scenario,
  SearchReelsResponse,
  TopReelsResponse,
  AnalyzeReelResponse,
  ExistingAnalysisResponse,
  GenerateScenarioResponse,
  SearchAccountResponse,
  TrackAccountResponse,
  TrackedAccountsResponse,
  TrackedReelsResponse,
  UntrackAccountResponse,
  ToggleFavoriteResponse,
  FavoritesResponse,
  TopReelCategory,
} from '../types/laba';
import { showAlert, showPopupMessage } from '../app/telegram/telegramHelpers';
import { supabase } from './supabase';

// Laba endpoints are served from the dedicated Railway service backend.
const API_URL = 'https://metaflora-service.ru';
const LABA_API_FALLBACK_URLS = Array.from(new Set([
  API_URL,
  import.meta.env.VITE_API_URL,
  'https://service-production-f0b1.up.railway.app',
].filter(Boolean)));
const LABA_CACHE_PREFIX = 'metaflora_laba_cache_v1_';
const LABA_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const LABA_MEDIA_VERSION = '20260402d';

interface LabaCachePayload<T> {
  timestamp: number;
  data: T;
}

function getLabaStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function readLabaCache<T>(key: string): T | null {
  const storage = getLabaStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(`${LABA_CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LabaCachePayload<T>;
    if (!parsed || typeof parsed.timestamp !== 'number') return null;
    if (Date.now() - parsed.timestamp > LABA_CACHE_TTL_MS) {
      storage.removeItem(`${LABA_CACHE_PREFIX}${key}`);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeLabaCache<T>(key: string, data: T): void {
  const storage = getLabaStorage();
  if (!storage) return;

  try {
    storage.setItem(`${LABA_CACHE_PREFIX}${key}`, JSON.stringify({
      timestamp: Date.now(),
      data,
    } satisfies LabaCachePayload<T>));
  } catch {
    // Ignore storage quota errors, network data is still the source of truth.
  }
}

function removeLabaCache(key: string): void {
  const storage = getLabaStorage();
  if (!storage) return;
  storage.removeItem(`${LABA_CACHE_PREFIX}${key}`);
}

function sanitizeCacheKeyPart(value: string | number): string {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9а-яё_-]+/gi, '_');
}

export function getCachedTopReels(category: TopReelCategory): Reel[] {
  return readLabaCache<Reel[]>(`top_reels_${sanitizeCacheKeyPart(category)}`) || [];
}

export function cacheTopReels(category: TopReelCategory, reels: Reel[]): void {
  writeLabaCache(`top_reels_${sanitizeCacheKeyPart(category)}`, reels);
}

export function getCachedSearchReels(query: string): Reel[] {
  return readLabaCache<Reel[]>(`search_reels_${sanitizeCacheKeyPart(query)}`) || [];
}

export function cacheSearchReels(query: string, reels: Reel[]): void {
  writeLabaCache(`search_reels_${sanitizeCacheKeyPart(query)}`, reels);
}

export function getCachedFavorites(userId: number): Reel[] {
  return readLabaCache<Reel[]>(`favorites_${sanitizeCacheKeyPart(userId)}`) || [];
}

export function cacheFavorites(userId: number, reels: Reel[]): void {
  writeLabaCache(`favorites_${sanitizeCacheKeyPart(userId)}`, reels);
}

export function getCachedTrackedAccounts(userId: number): TrackedAccount[] {
  return readLabaCache<TrackedAccount[]>(`tracked_accounts_${sanitizeCacheKeyPart(userId)}`) || [];
}

export function cacheTrackedAccounts(userId: number, accounts: TrackedAccount[]): void {
  writeLabaCache(`tracked_accounts_${sanitizeCacheKeyPart(userId)}`, accounts);
}

export function normalizeInstagramHandle(value: string | null | undefined): string {
  return String(value || '').trim().replace(/^@+/, '').toLowerCase();
}

export function findTrackedAccountByUsername(
  accounts: TrackedAccount[],
  username: string | null | undefined,
): TrackedAccount | null {
  const normalizedUsername = normalizeInstagramHandle(username);
  if (!normalizedUsername) return null;
  return accounts.find((account) => normalizeInstagramHandle(account.username) === normalizedUsername) || null;
}

export function getCachedTrackedReels(userId: number, accountId: string): Reel[] {
  return readLabaCache<Reel[]>(`tracked_reels_${sanitizeCacheKeyPart(userId)}_${sanitizeCacheKeyPart(accountId)}`) || [];
}

export function cacheTrackedReels(userId: number, accountId: string, reels: Reel[]): void {
  writeLabaCache(`tracked_reels_${sanitizeCacheKeyPart(userId)}_${sanitizeCacheKeyPart(accountId)}`, reels);
}

export function clearTrackedReelsCache(userId: number, accountId: string): void {
  removeLabaCache(`tracked_reels_${sanitizeCacheKeyPart(userId)}_${sanitizeCacheKeyPart(accountId)}`);
}

// ================================================
// УТИЛИТЫ ДЛЯ РАБОТЫ С ИЗОБРАЖЕНИЯМИ
// ================================================

function buildProxyImageUrl(baseUrl: string, url: string): string {
  return `${baseUrl}/api/proxy-image?url=${encodeURIComponent(url)}&v=${LABA_MEDIA_VERSION}`;
}

function buildReelMediaUrl(baseUrl: string, reelId: string, kind: 'cover' | 'avatar'): string {
  return `${baseUrl}/api/laba/reel-media?reelId=${encodeURIComponent(reelId)}&kind=${kind}&v=${LABA_MEDIA_VERSION}`;
}

function buildApiUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`;
}

async function fetchJsonWithTimeout<T>(baseUrl: string, path: string, init?: RequestInit, timeoutMs = 4500): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(buildApiUrl(baseUrl, path), {
      ...init,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json() as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchFirstSuccessfulJson<T>(baseUrls: string[], path: string, init?: RequestInit, timeoutMs = 4500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    let pending = baseUrls.length;
    let lastError: unknown = new Error('no api hosts configured');

    for (const baseUrl of baseUrls) {
      void fetchJsonWithTimeout<T>(baseUrl, path, init, timeoutMs)
        .then((payload) => {
          if (settled) return;
          settled = true;
          resolve(payload);
        })
        .catch((error) => {
          lastError = error;
          pending -= 1;
          if (!settled && pending === 0) {
            reject(lastError);
          }
        });
    }
  });
}

async function fetchLabaJson<T>(path: string, init?: RequestInit): Promise<T> {
  let lastError: unknown;

  for (const baseUrl of LABA_API_FALLBACK_URLS) {
    try {
      return await fetchJsonWithTimeout<T>(baseUrl, path, init);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('не удалось связаться с laba api');
}

async function fetchTopReelsDirectFromSupabase(category: TopReelCategory): Promise<Reel[]> {
  const { data: topReelsData, error: topError } = await supabase
    .from('laba_top_reels')
    .select('reel_id, position')
    .eq('category', category)
    .order('position', { ascending: true });

  if (topError || !topReelsData?.length) {
    return [];
  }

  const reelIds = topReelsData.map((item: any) => item.reel_id).filter(Boolean);
  if (!reelIds.length) {
    return [];
  }

  const { data: reelsData, error: reelsError } = await supabase
    .from('laba_reels')
    .select('*')
    .in('id', reelIds);

  if (reelsError || !reelsData?.length) {
    return [];
  }

  const reelsMap = new Map(reelsData.map((reel: any) => [reel.id, reel]));
  return reelIds
    .map((id: string) => reelsMap.get(id))
    .filter(Boolean)
    .map((reel: any) => ({
      id: reel.id,
      instagramReelId: reel.instagram_reel_id,
      reelUrl: reel.reel_url,
      coverImageUrl: reel.cover_image_url || '',
      videoUrl: reel.video_url || '',
      caption: reel.caption || null,
      viewsCount: reel.views_count || 0,
      likesCount: reel.likes_count || 0,
      commentsCount: reel.comments_count || 0,
      publishedAt: reel.published_at,
      viralityScore: reel.virality_score || null,
      isNew: Boolean(reel.is_new),
      accountUsername: reel.account_username || '',
      accountFollowers: reel.account_followers || 0,
      accountProfilePicUrl: reel.account_profile_pic_url || null,
      trackedAccountId: null,
      isFavorite: false,
    } satisfies Reel));
}

function buildAllProxyImageUrls(url: string): string[] {
  return LABA_API_FALLBACK_URLS.map((baseUrl) => buildProxyImageUrl(baseUrl, url));
}

function buildAllReelMediaUrls(reelId: string, kind: 'cover' | 'avatar'): string[] {
  return LABA_API_FALLBACK_URLS.map((baseUrl) => buildReelMediaUrl(baseUrl, reelId, kind));
}

function uniqueImageSources(sources: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const source of sources) {
    const normalized = String(source || '').trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function appendMediaVersion(url: string | null | undefined): string | null {
  const normalized = String(url || '').trim();
  if (!normalized || /[?&]v=20260402d\b/.test(normalized)) return normalized || null;
  return `${normalized}${normalized.includes('?') ? '&' : '?'}v=${LABA_MEDIA_VERSION}`;
}

/**
 * Если есть instagram page URL, всегда используем его как первичный live source.
 * Так backend сам вытаскивает свежий og:image и не зависит от протухших CDN ссылок.
 */
export function convertInstagramImageUrl(url: string | null | undefined): string | null {
  if (!url || url === '') return null;

  if (LABA_API_FALLBACK_URLS.some((baseUrl) => url.startsWith(`${baseUrl}/api/proxy-image`))) return url;

  if (/^https?:\/\/(www\.)?instagram\.com\//i.test(url)) {
    return buildProxyImageUrl(LABA_API_FALLBACK_URLS[0], url);
  }

  return appendMediaVersion(url);
}

export function getReelCoverSrc(reel: Pick<Reel, 'id' | 'instagramReelId' | 'reelUrl' | 'coverImageUrl'>): string | null {
  const reelId = String(reel.id || '').trim();
  if (reelId) {
    return buildReelMediaUrl(LABA_API_FALLBACK_URLS[0], reelId, 'cover');
  }
  const directCoverUrl = convertInstagramImageUrl(reel.coverImageUrl) || reel.coverImageUrl || null;
  const instagramReelId = String(reel.instagramReelId || '').trim();
  if (instagramReelId) {
    return buildProxyImageUrl(LABA_API_FALLBACK_URLS[0], `https://www.instagram.com/p/${instagramReelId}/`);
  }

  if (reel.reelUrl && /^https?:\/\/(www\.)?instagram\.com\//i.test(reel.reelUrl)) {
    return buildProxyImageUrl(LABA_API_FALLBACK_URLS[0], reel.reelUrl);
  }

  return directCoverUrl;
}

export function getReelCoverSources(reel: Pick<Reel, 'id' | 'instagramReelId' | 'reelUrl' | 'coverImageUrl'>): string[] {
  const reelId = String(reel.id || '').trim();
  const directCoverUrl = convertInstagramImageUrl(reel.coverImageUrl) || reel.coverImageUrl || null;
  const instagramReelId = String(reel.instagramReelId || '').trim();
  const instagramPageUrl = instagramReelId ? `https://www.instagram.com/p/${instagramReelId}/` : null;
  const proxiedReelUrls =
    reel.reelUrl && /^https?:\/\/(www\.)?instagram\.com\//i.test(reel.reelUrl)
      ? buildAllProxyImageUrls(reel.reelUrl)
      : [];

  return uniqueImageSources([
    ...(reelId ? buildAllReelMediaUrls(reelId, 'cover') : []),
    ...(instagramPageUrl ? buildAllProxyImageUrls(instagramPageUrl) : []),
    ...proxiedReelUrls,
    directCoverUrl,
  ]);
}

export function getReelAvatarSources(
  reel: Pick<Reel, 'id' | 'accountUsername' | 'accountProfilePicUrl'>
): string[] {
  const reelId = String(reel.id || '').trim();
  const directUrl = appendMediaVersion(reel.accountProfilePicUrl);
  const normalizedUsername = String(reel.accountUsername || '').trim().replace(/^@+/, '');

  return uniqueImageSources([
    ...(reelId ? buildAllReelMediaUrls(reelId, 'avatar') : []),
    directUrl,
    ...(directUrl ? buildAllProxyImageUrls(directUrl) : []),
    ...(normalizedUsername ? buildAllProxyImageUrls(`https://www.instagram.com/${normalizedUsername}/`) : []),
  ]);
}

export function setCachedFavoriteState(userId: number, reel: Reel | null | undefined, nextIsFavorite: boolean): Reel[] {
  const cachedFavorites = getCachedFavorites(userId);
  if (!reel) {
    return cachedFavorites;
  }

  const nextFavorites = nextIsFavorite
    ? [{ ...reel, isFavorite: true }, ...cachedFavorites.filter((item) => item.id !== reel.id)]
    : cachedFavorites.filter((item) => item.id !== reel.id);

  cacheFavorites(userId, nextFavorites);
  return nextFavorites;
}

export function getInstagramAvatarSrc(username?: string | null, fallbackUrl?: string | null): string | null {
  const [primary] = getInstagramAvatarSources(username, fallbackUrl);
  return primary || null;
}

export function getInstagramAvatarSources(username?: string | null, fallbackUrl?: string | null): string[] {
  const normalizedUsername = String(username || '').trim().replace(/^@+/, '');
  const directUrl = appendMediaVersion(fallbackUrl);
  return uniqueImageSources([
    directUrl,
    ...(directUrl ? buildAllProxyImageUrls(directUrl) : []),
    ...(normalizedUsername ? buildAllProxyImageUrls(`https://www.instagram.com/${normalizedUsername}/`) : []),
  ]);
}

export function formatFollowersLabel(followersCount: number | null | undefined): string {
  const followers = Number(followersCount || 0);
  if (followers <= 0) return 'закрытый профиль';
  return `${formatCount(followers)} подписчиков`;
}

// ================================================
// ОСНОВНЫЕ API ФУНКЦИИ
// ================================================

/**
 * Поиск reels по ключевому слову
 * Стоимость: 25 метакоинов
 */
export async function searchReels(keyword: string, userId: number): Promise<Reel[]> {
  const data = await fetchLabaJson<SearchReelsResponse>('/api/laba/search-reels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, userId }),
  });

  if (!data.success) {
    throw new Error(data.error || 'ошибка поиска');
  }

  return data.reels;
}

/**
 * Получить топ reels для главного экрана
 * Бесплатно
 */
export async function getTopReels(category: TopReelCategory = 'нейросети'): Promise<Reel[]> {
  let data: TopReelsResponse | null = null;
  try {
    const path = `/api/laba/top-reels?category=${encodeURIComponent(category)}&t=${Date.now()}`;
    data = await fetchFirstSuccessfulJson<TopReelsResponse>(LABA_API_FALLBACK_URLS, path, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    }, 3000);
  } catch (error) {
    console.error('Top reels request failed:', error);
    const directFallback = await fetchTopReelsDirectFromSupabase(category);
    return directFallback.length ? directFallback : getCachedTopReels(category);
  }

  if (!data.success) {
    console.error('Ошибка загрузки топ reels:', data.error);
    const directFallback = await fetchTopReelsDirectFromSupabase(category);
    return directFallback.length ? directFallback : getCachedTopReels(category);
  }

  if (data.reels?.length) {
    return data.reels;
  }

  const directFallback = await fetchTopReelsDirectFromSupabase(category);
  return directFallback.length ? directFallback : [];
}

/**
 * ИИ-анализ reel (транскрибация, хук, виральность)
 * Стоимость: 100 метакоинов
 */
export async function analyzeReel(reelId: string, userId: number): Promise<{ analysis: Analysis; scenario?: Scenario | null }> {
  const response = await fetch(`${API_URL}/api/laba/analyze-reel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reelId, userId }),
  });

  const data: AnalyzeReelResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'ошибка анализа');
  }

  return {
    analysis: data.analysis,
    scenario: data.scenario ?? null,
  };
}

/**
 * Получить уже существующий анализ и сценарий без повторного списания метакоинов
 */
export async function getExistingAnalysis(reelId: string, userId: number): Promise<{ analysis: Analysis | null; scenario?: Scenario | null }> {
  const response = await fetch(
    `${API_URL}/api/laba/existing-analysis?reelId=${encodeURIComponent(reelId)}&userId=${encodeURIComponent(String(userId))}`
  );

  const data: ExistingAnalysisResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'ошибка загрузки сохраненного анализа');
  }

  return {
    analysis: data.analysis ?? null,
    scenario: data.scenario ?? null,
  };
}

/**
 * Генерация сценария на основе анализа
 * Стоимость: 50 метакоинов
 */
export async function generateScenario(analysisId: string, userId: number): Promise<Scenario> {
  const response = await fetch(`${API_URL}/api/laba/generate-scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, userId }),
  });

  const data: GenerateScenarioResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'ошибка генерации сценария');
  }

  return data.scenario;
}

/**
 * Поиск Instagram аккаунта по нику или ссылке
 * Бесплатно
 */
export async function searchAccount(query: string): Promise<InstagramAccount> {
  const normalizedQuery = query.includes('instagram.com')
    ? query.trim()
    : query.trim().replace(/^@+/, '');

  const response = await fetch(`${API_URL}/api/laba/search-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: normalizedQuery }),
  });

  const data: SearchAccountResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'аккаунт не найден');
  }

  return data.account;
}

/**
 * Начать отслеживание Instagram аккаунта
 * Стоимость: 100 метакоинов + 15 метакоинов за каждое видео
 */
export async function trackAccount(username: string, userId: number): Promise<{
  accountId: string;
  reelsAdded: number;
  showPopup?: boolean;
  popupMessage?: string;
}> {
  const response = await fetch(`${API_URL}/api/laba/track-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, userId }),
  });

  const data: TrackAccountResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'ошибка отслеживания');
  }

  return {
    accountId: data.accountId,
    reelsAdded: data.reelsAdded || 0,
    showPopup: data.showPopup,
    popupMessage: data.popupMessage,
  };
}

/**
 * Скрапинг reels для отслеживаемого аккаунта
 */
export async function scrapeAccountReels(accountId: string, userId: number): Promise<{
  reelsAdded: number;
  showPopup?: boolean;
  popupMessage?: string;
}> {
  const response = await fetch(`${API_URL}/api/laba/scrape-account-reels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, userId }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'ошибка скрапинга reels');
  }

  return {
    reelsAdded: data.reelsAdded || 0,
    showPopup: data.showPopup,
    popupMessage: data.popupMessage,
  };
}

/**
 * Получить список отслеживаемых аккаунтов
 */
export async function getTrackedAccounts(userId: number): Promise<TrackedAccount[]> {
  const response = await fetch(`${API_URL}/api/laba/tracked-accounts?userId=${userId}`);
  const data: TrackedAccountsResponse = await response.json();

  if (!data.success) {
    console.error('Ошибка загрузки отслеживаемых аккаунтов:', data.error);
    return [];
  }

  return data.accounts || [];
}

export async function refreshTrackedAccounts(userId: number): Promise<TrackedAccount[]> {
  const accounts = await getTrackedAccounts(userId);
  cacheTrackedAccounts(userId, accounts);
  return accounts;
}

/**
 * Получить reels отслеживаемого аккаунта
 */
export async function getTrackedReels(accountId: string, userId: number): Promise<Reel[]> {
  const response = await fetch(
    `${API_URL}/api/laba/tracked-reels?accountId=${accountId}&userId=${userId}`
  );
  const data: TrackedReelsResponse = await response.json();

  if (!data.success) {
    console.error('Ошибка загрузки reels:', data.error);
    return [];
  }

  return data.reels || [];
}

/**
 * Убрать аккаунт из отслеживания
 */
export async function untrackAccount(accountId: string, userId: number): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/laba/untrack-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, userId }),
  });

  const data: UntrackAccountResponse = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'ошибка удаления аккаунта');
  }
  return true;
}

/**
 * Добавить/убрать reel из избранного
 */
export async function toggleFavorite(reelId: string, userId: number): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/laba/toggle-favorite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reelId, userId }),
  });

  const data: ToggleFavoriteResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'ошибка избранного');
  }

  return data.isFavorite;
}

/**
 * Получить избранные reels
 */
export async function getFavorites(userId: number): Promise<Reel[]> {
  const response = await fetch(`${API_URL}/api/laba/favorites?userId=${userId}`);
  const data: FavoritesResponse = await response.json();

  if (!data.success) {
    console.error('Ошибка загрузки избранного:', data.error);
    return [];
  }

  return data.reels || [];
}

// ================================================
// УТИЛИТЫ ДЛЯ ФОРМАТИРОВАНИЯ
// ================================================

/**
 * Форматирование чисел для отображения (227000 → "227к") - ОКРУГЛЕНИЕ ДО ЦЕЛОГО
 */
export function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${Math.round(count / 1000000)}М`;
  }
  if (count >= 1000) {
    return `${Math.round(count / 1000)}к`;
  }
  return count.toString();
}

/**
 * Правильное склонение слов
 */
function pluralize(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/**
 * Форматирование даты (ISO timestamp → "2 месяца назад")
 */
export function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const published = new Date(dateString);
  const diffMs = now.getTime() - published.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffMins < 1) return 'сегодня';
  if (diffMins < 60) return `${diffMins} ${pluralize(diffMins, 'минуту', 'минуты', 'минут')} назад`;
  if (diffHours < 24) return `${diffHours} ${pluralize(diffHours, 'час', 'часа', 'часов')} назад`;
  if (diffDays === 1) return '1 день назад';
  if (diffDays < 7) return `${diffDays} ${pluralize(diffDays, 'день', 'дня', 'дней')} назад`;
  if (diffWeeks < 4) return `${diffWeeks} ${pluralize(diffWeeks, 'неделю', 'недели', 'недель')} назад`;
  if (diffMonths < 12) return `${diffMonths} ${pluralize(diffMonths, 'месяц', 'месяца', 'месяцев')} назад`;
  
  return `${diffYears} ${pluralize(diffYears, 'год', 'года', 'лет')} назад`;
}

/**
 * Расчет engagement rate (вовлеченность)
 */
export function calculateEngagementRate(likes: number, comments: number, views: number): number {
  if (views === 0) return 0;
  return ((likes + comments) / views) * 100;
}

/**
 * Форматирование engagement rate для отображения
 */
export function formatEngagementRate(likes: number, comments: number, views: number): string {
  const rate = calculateEngagementRate(likes, comments, views);
  return `${rate.toFixed(2)}%`;
}

/**
 * Парсинг username из Instagram ссылки или ника
 * @example
 * parseInstagramUsername('@mishchenko.is') -> 'mishchenko.is'
 * parseInstagramUsername('https://instagram.com/mishchenko.is') -> 'mishchenko.is'
 * parseInstagramUsername('mishchenko.is') -> 'mishchenko.is'
 */
export function parseInstagramUsername(query: string): string {
  // Убираем @
  let username = query.trim().replace(/^@/, '');

  // Парсим URL
  try {
    const url = new URL(username);
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      username = pathParts[0];
    }
  } catch {
    // Не URL, оставляем как есть
  }

  // Очистка от лишних символов
  username = username.replace(/[^a-zA-Z0-9._]/g, '');

  return username;
}

/**
 * Проверка валидности Instagram username
 */
export function isValidInstagramUsername(username: string): boolean {
  // Instagram username должен быть 1-30 символов, только буквы, цифры, точки, подчеркивания
  return /^[a-zA-Z0-9._]{1,30}$/.test(username);
}

/**
 * Получить цвет для виральности (для UI)
 */
export function getViralityColor(score: number): string {
  if (score >= 7) return '#d5fc44'; // Зеленый/лаймовый
  if (score >= 4) return '#ffff00'; // Желтый
  return '#ff0000'; // Красный
}

/**
 * Получить текстовое описание виральности
 */
export function getViralityLabel(score: number): string {
  if (score >= 9) return 'вирусный контент';
  if (score >= 7) return 'высокая виральность';
  if (score >= 5) return 'средняя виральность';
  if (score >= 3) return 'низкая виральность';
  return 'слабый контент';
}

/**
 * Сортировка reels
 */
export function sortReels(
  reels: Reel[],
  sortBy: 'views' | 'likes' | 'comments' | 'date' | 'virality',
  order: 'asc' | 'desc' = 'desc'
): Reel[] {
  const sorted = [...reels].sort((a, b) => {
    let valueA: number;
    let valueB: number;

    switch (sortBy) {
      case 'views':
        valueA = a.viewsCount;
        valueB = b.viewsCount;
        break;
      case 'likes':
        valueA = a.likesCount;
        valueB = b.likesCount;
        break;
      case 'comments':
        valueA = a.commentsCount;
        valueB = b.commentsCount;
        break;
      case 'date':
        valueA = new Date(a.publishedAt).getTime();
        valueB = new Date(b.publishedAt).getTime();
        break;
      case 'virality':
        valueA = a.viralityScore || 0;
        valueB = b.viralityScore || 0;
        break;
      default:
        return 0;
    }

    return order === 'asc' ? valueA - valueB : valueB - valueA;
  });

  return sorted;
}

/**
 * Фильтрация reels по размеру аккаунта
 */
export function filterReelsByAccountSize(
  reels: Reel[],
  accountSize: '0-10k' | '10k-100k' | '100k-300k' | '300k-1m' | '1m+'
): Reel[] {
  const ranges: Record<typeof accountSize, [number, number]> = {
    '0-10k': [0, 10000],
    '10k-100k': [10000, 100000],
    '100k-300k': [100000, 300000],
    '300k-1m': [300000, 1000000],
    '1m+': [1000000, Infinity],
  };

  const [min, max] = ranges[accountSize];
  return reels.filter(reel => reel.accountFollowers >= min && reel.accountFollowers < max);
}

/**
 * Получить ID пользователя из Telegram WebApp
 */
export function getTelegramUserId(): number | null {
  if (typeof window === 'undefined') return null;
  
  const webApp = (window as any).Telegram?.WebApp;
  if (!webApp?.initDataUnsafe?.user?.id) {
    console.error('Telegram User ID не найден');
    return null;
  }
  
  return webApp.initDataUnsafe.user.id;
}

/**
 * Показать сообщение пользователю через Telegram WebApp
 */
export function showMessage(message: string, type: 'alert' | 'popup' = 'popup'): void {
  if (type === 'alert') {
    void showAlert(message);
    return;
  }

  showPopupMessage(message);
}

/**
 * Открыть URL в браузере
 */
export function openUrl(url: string): void {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}
