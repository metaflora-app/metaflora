// ============================================
// METAFLORA CMS - API ДЛЯ РАБОТЫ С КОНТЕНТОМ
// ============================================

import type {
  WorkshopPrompt,
  PolygonArticle,
  AcademyCourse,
  AcademyLesson,
  AcademyVideo,
  ContentListResponse,
  ContentItemResponse,
} from '../types/content';

// Базовый URL для API (будет использоваться API proxy веб-сервиса)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://metaflora-service.ru';

// ============================================
// ЦЕХ - ПРОМПТЫ
// ============================================

export async function getWorkshopPrompts(
  filters?: { tags?: string[]; isActive?: boolean; limit?: number; offset?: number }
): Promise<ContentListResponse<WorkshopPrompt>> {
  try {
    const cacheKey = `workshop_prompts_${JSON.stringify(filters || {})}`;
    const params = new URLSearchParams();
    if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
    if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const response = await fetch(`${API_BASE_URL}/api/content/workshop-prompts?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ContentListResponse<WorkshopPrompt> = await response.json();
    if (!result.error && result.data.length > 0) {
      setCachedData(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error('Error fetching workshop prompts:', error);
    return { data: [], count: 0, error: String(error) };
  }
}

export async function getWorkshopPromptById(id: string): Promise<ContentItemResponse<WorkshopPrompt>> {
  try {
    // Добавляем timestamp для обхода кэша браузера
    const timestamp = new Date().getTime();
    const response = await fetch(`${API_BASE_URL}/api/content/workshop-prompts/${id}?t=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching workshop prompt:', error);
    return { data: null, error: String(error) };
  }
}

export async function getWorkshopPromptByIdWithCache(id: string): Promise<ContentItemResponse<WorkshopPrompt>> {
  const cacheKey = `workshop_prompt_${id}`;
  const cached = getCachedData<ContentItemResponse<WorkshopPrompt>>(cacheKey);

  if (cached?.data) {
    return cached;
  }

  const result = await getWorkshopPromptById(id);
  if (!result.error && result.data) {
    setCachedData(cacheKey, result);
  }

  return result;
}

export async function trackWorkshopPromptView(id: string, userId?: number | null): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/content/workshop-prompts/${id}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId || null }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error tracking workshop prompt view:', error);
    return false;
  }
}

export async function trackWorkshopPromptCopy(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/content/workshop-prompts/${id}/copy`, {
      method: 'POST',
    });
    return response.ok;
  } catch (error) {
    console.error('Error tracking workshop prompt copy:', error);
    return false;
  }
}

// ============================================
// ПОЛИГОН - СТАТЬИ
// ============================================

export async function getPolygonArticles(
  filters?: { tags?: string[]; keywords?: string[]; isActive?: boolean; limit?: number; offset?: number }
): Promise<ContentListResponse<PolygonArticle>> {
  try {
    const cacheKey = `polygon_articles_${JSON.stringify(filters || {})}`;
    const params = new URLSearchParams();
    params.append('t', String(Date.now()));
    if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
    if (filters?.keywords?.length) params.append('keywords', filters.keywords.join(','));
    if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const response = await fetch(`${API_BASE_URL}/api/content/polygon-articles?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ContentListResponse<PolygonArticle> = await response.json();
    if (!result.error && result.data.length > 0) {
      setCachedData(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error('Error fetching polygon articles:', error);
    return { data: [], count: 0, error: String(error) };
  }
}

export async function getPolygonArticleById(id: string): Promise<ContentItemResponse<PolygonArticle>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/content/polygon-articles/${id}?t=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching polygon article:', error);
    return { data: null, error: String(error) };
  }
}

// ============================================
// АКАДЕМИЯ - КУРСЫ
// ============================================

export async function getAcademyCourses(
  filters?: { courseType?: string; isActive?: boolean }
): Promise<ContentListResponse<AcademyCourse>> {
  try {
    const params = new URLSearchParams();
    if (filters?.courseType) params.append('course_type', filters.courseType);
    if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));

    const response = await fetch(`${API_BASE_URL}/api/content/academy-courses?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching academy courses:', error);
    return { data: [], count: 0, error: String(error) };
  }
}

// ============================================
// АКАДЕМИЯ - УРОКИ
// ============================================

export async function getAcademyLessons(
  courseId: string,
  filters?: { isActive?: boolean; limit?: number; offset?: number }
): Promise<ContentListResponse<AcademyLesson>> {
  try {
    const params = new URLSearchParams();
    params.append('course_id', courseId);
    if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const response = await fetch(`${API_BASE_URL}/api/content/academy-lessons?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching academy lessons:', error);
    return { data: [], count: 0, error: String(error) };
  }
}

export async function getAcademyLessonById(id: string): Promise<ContentItemResponse<AcademyLesson>> {
  try {
    // Добавляем timestamp для обхода кэша браузера
    const timestamp = new Date().getTime();
    const response = await fetch(`${API_BASE_URL}/api/content/academy-lessons/${id}?t=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching academy lesson:', error);
    return { data: null, error: String(error) };
  }
}

// ============================================
// АКАДЕМИЯ - ВИДЕОУРОКИ
// ============================================

export async function getAcademyVideos(lessonId: string): Promise<ContentListResponse<AcademyVideo>> {
  try {
    // Добавляем timestamp для обхода кэша браузера
    const timestamp = new Date().getTime();
    const response = await fetch(`${API_BASE_URL}/api/content/academy-videos/${lessonId}?t=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching academy videos:', error);
    return { data: [], count: 0, error: String(error) };
  }
}

// ============================================
// КЕШИРОВАНИЕ В LOCALSTORAGE
// ============================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCacheKey(key: string): string {
  return `metaflora_content_${key}`;
}

export function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(getCacheKey(key));
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    if (now - entry.timestamp > CACHE_DURATION) {
      localStorage.removeItem(getCacheKey(key));
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(getCacheKey(key), JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

export function clearContentCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('metaflora_content_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// ============================================
// ХУКИ ДЛЯ РАБОТЫ С КЕШИРОВАНИЕМ
// ============================================

export async function getWorkshopPromptsWithCache(
  filters?: Parameters<typeof getWorkshopPrompts>[0]
): Promise<ContentListResponse<WorkshopPrompt>> {
  const cacheKey = `workshop_prompts_${JSON.stringify(filters || {})}`;
  const cached = getCachedData<ContentListResponse<WorkshopPrompt>>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await getWorkshopPrompts(filters);
  if (!result.error && result.data.length > 0) {
    setCachedData(cacheKey, result);
  }
  
  return result;
}

export async function getPolygonArticlesWithCache(
  filters?: Parameters<typeof getPolygonArticles>[0]
): Promise<ContentListResponse<PolygonArticle>> {
  const cacheKey = `polygon_articles_${JSON.stringify(filters || {})}`;
  const cached = getCachedData<ContentListResponse<PolygonArticle>>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await getPolygonArticles(filters);
  if (!result.error && result.data.length > 0) {
    setCachedData(cacheKey, result);
  }
  
  return result;
}

export async function getAcademyCoursesWithCache(
  filters?: Parameters<typeof getAcademyCourses>[0]
): Promise<ContentListResponse<AcademyCourse>> {
  const cacheKey = `academy_courses_${JSON.stringify(filters || {})}`;
  const cached = getCachedData<ContentListResponse<AcademyCourse>>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await getAcademyCourses(filters);
  if (!result.error && result.data.length > 0) {
    setCachedData(cacheKey, result);
  }
  
  return result;
}

// ============================================
// ДЕМО - КУРСЫ (копия academy)
// ============================================

export async function getDemoCourses(
  filters?: { courseType?: string; isActive?: boolean }
): Promise<ContentListResponse<AcademyCourse>> {
  try {
    const params = new URLSearchParams();
    if (filters?.courseType) params.append('course_type', filters.courseType);
    if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));

    const response = await fetch(`${API_BASE_URL}/api/content/demo-courses?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching demo courses:', error);
    return { data: [], count: 0, error: String(error) };
  }
}

export async function getDemoLessons(
  courseId: string,
  filters?: { isActive?: boolean; limit?: number; offset?: number }
): Promise<ContentListResponse<AcademyLesson>> {
  try {
    const params = new URLSearchParams();
    params.append('course_id', courseId);
    if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const response = await fetch(`${API_BASE_URL}/api/content/demo-lessons?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching demo lessons:', error);
    return { data: [], count: 0, error: String(error) };
  }
}

export async function getDemoLessonById(
  id: string
): Promise<ContentItemResponse<AcademyLesson>> {
  try {
    // Добавляем timestamp для обхода кэша браузера
    const timestamp = new Date().getTime();
    const response = await fetch(`${API_BASE_URL}/api/content/demo-lessons/${id}?t=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching demo lesson:', error);
    return { data: null, error: String(error) };
  }
}

export async function getDemoVideos(lessonId: string): Promise<ContentListResponse<AcademyVideo>> {
  try {
    // Добавляем timestamp для обхода кэша браузера
    const timestamp = new Date().getTime();
    const response = await fetch(`${API_BASE_URL}/api/content/demo-videos/${lessonId}?t=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching demo videos:', error);
    return { data: [], count: 0, error: String(error) };
  }
}
