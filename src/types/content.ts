// ============================================
// METAFLORA CMS - ТИПЫ КОНТЕНТА
// ============================================

// ЦЕХ - Промпты
export interface WorkshopPrompt {
  id: string;
  title: string;
  description: string | null;
  prompt_text: string | null;
  cover_image_url: string | null;
  filter_tags: string[] | null;
  search_keywords: string[] | null;
  views_count: number;
  copies_count: number;
  likes_count: number;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface WorkshopPromptInput {
  title: string;
  description?: string;
  prompt_text?: string;
  cover_image_url?: string;
  filter_tags?: string[];
  is_active?: boolean;
  order_index?: number;
}

// ПОЛИГОН - Статьи
export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'materials' | 'prompt';
  content: string;
}

export interface ArticleMaterial {
  name: string;
  url: string;
  size: string;
}

export interface PolygonArticle {
  id: string;
  title: string;
  annotation: string | null;
  cover_image_url: string | null;
  // Новый формат (приоритет)
  content_blocks: ContentBlock[] | null;
  // Старые поля для обратной совместимости
  content_text?: string | null;
  video_url?: string | null;
  prompt_text?: string | null;
  materials?: ArticleMaterial[] | null;
  filter_tags: string[] | null;
  keywords: string[] | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface PolygonArticleInput {
  title: string;
  annotation?: string;
  cover_image_url?: string;
  content_blocks?: ContentBlock[];
  filter_tags?: string[];
  keywords?: string[];
  is_active?: boolean;
  order_index?: number;
}

// АКАДЕМИЯ - Курсы
export type CourseType = 'система' | 'промптинг' | 'искусство' | 'автоматизация';

export interface AcademyCourse {
  id: string;
  course_type: CourseType;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AcademyCourseInput {
  course_type: CourseType;
  title: string;
  description?: string;
  cover_image_url?: string;
  is_active?: boolean;
  order_index?: number;
}

// АКАДЕМИЯ - Уроки
export interface AcademyLesson {
  id: string;
  course_id: string;
  lesson_number: number | null;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  annotation: string | null;
  prompt_text: string | null;
  filter_tags: string[] | null;
  keywords: string[] | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AcademyLessonInput {
  course_id: string;
  lesson_number?: number;
  title: string;
  description?: string;
  cover_image_url?: string;
  annotation?: string;
  prompt_text?: string;
  filter_tags?: string[];
  keywords?: string[];
  is_active?: boolean;
  order_index?: number;
}

// АКАДЕМИЯ - Видеоуроки
export interface AcademyVideo {
  id: string;
  lesson_id: string;
  title: string;
  video_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademyVideoInput {
  lesson_id: string;
  title: string;
  video_url?: string;
  is_active?: boolean;
}

// API Response типы
export interface ContentListResponse<T> {
  data: T[];
  count: number;
  error?: string;
}

export interface ContentItemResponse<T> {
  data: T | null;
  error?: string;
}

// Фильтры для контента
export const FILTER_TAGS = [
  'новые',
  'популярные',
  'топ-выбор',
  'недавние',
] as const;

export type FilterTag = typeof FILTER_TAGS[number];

// Типы для загрузки файлов
export interface FileUploadResult {
  url: string;
  path: string;
  error?: string;
}

export type FileUploadBucket = 
  | 'workshop-covers'
  | 'polygon-covers'
  | 'academy-covers'
  | 'academy-videos'
  | 'materials';

// Константы размеров файлов
export const FILE_SIZE_LIMITS = {
  COVER_IMAGE: 5 * 1024 * 1024, // 5MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  MATERIAL: 50 * 1024 * 1024, // 50MB
} as const;

// Допустимые форматы файлов
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  VIDEO: ['video/mp4', 'video/webm'],
  MATERIAL: [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;
