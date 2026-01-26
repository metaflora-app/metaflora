-- ============================================
-- METAFLORA CMS - DATABASE SETUP
-- Дата создания: 2026-01-26
-- ============================================

-- 1. ПРОМПТЫ ЦЕХА (Workshop Prompts)
CREATE TABLE IF NOT EXISTS workshop_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  filter_tags TEXT[],
  is_active BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. СТАТЬИ ПОЛИГОНА (Polygon Articles)
CREATE TABLE IF NOT EXISTS polygon_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  annotation TEXT,
  cover_image_url TEXT,
  content_text TEXT,
  video_url TEXT,
  prompt_text TEXT,
  materials JSONB,
  filter_tags TEXT[],
  keywords TEXT[],
  is_active BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. КУРСЫ АКАДЕМИИ (Academy Courses)
CREATE TABLE IF NOT EXISTS academy_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_type TEXT NOT NULL CHECK (course_type IN ('система', 'промптинг', 'искусство', 'автоматизация')),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. УРОКИ АКАДЕМИИ (Academy Lessons)
CREATE TABLE IF NOT EXISTS academy_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE,
  lesson_number INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  annotation TEXT,
  prompt_text TEXT,
  materials JSONB,
  filter_tags TEXT[],
  keywords TEXT[],
  is_active BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ВИДЕОУРОКИ АКАДЕМИИ (Academy Videos)
CREATE TABLE IF NOT EXISTS academy_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES academy_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ИНДЕКСЫ ДЛЯ БЫСТРОЙ ВЫБОРКИ
-- ============================================

CREATE INDEX IF NOT EXISTS idx_workshop_prompts_active ON workshop_prompts(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_polygon_articles_active ON polygon_articles(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_academy_courses_active ON academy_courses(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_course ON academy_lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_academy_videos_lesson ON academy_videos(lesson_id);

-- ============================================
-- ТРИГГЕРЫ ДЛЯ АВТООБНОВЛЕНИЯ updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workshop_prompts_updated_at
  BEFORE UPDATE ON workshop_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polygon_articles_updated_at
  BEFORE UPDATE ON polygon_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_courses_updated_at
  BEFORE UPDATE ON academy_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_lessons_updated_at
  BEFORE UPDATE ON academy_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- КОММЕНТАРИИ К ТАБЛИЦАМ
-- ============================================

COMMENT ON TABLE workshop_prompts IS 'Промпты для раздела Цех';
COMMENT ON TABLE polygon_articles IS 'Статьи для раздела Полигон';
COMMENT ON TABLE academy_courses IS 'Курсы для раздела Академия';
COMMENT ON TABLE academy_lessons IS 'Уроки курсов Академии';
COMMENT ON TABLE academy_videos IS 'Видеоуроки для уроков Академии';

-- ============================================
-- ИНСТРУКЦИЯ ПО СОЗДАНИЮ STORAGE БАКЕТОВ
-- ============================================

/*
ВАЖНО: Выполнить в Supabase Dashboard -> Storage

1. Создать бакеты:
   - workshop-covers (Public)
   - polygon-covers (Public)
   - academy-covers (Public)
   - academy-videos (Private/Authenticated)
   - materials (Private/Authenticated)

2. Настройки доступа:
   Public бакеты:
   - Разрешить публичный доступ на чтение
   - Загрузка только для authenticated пользователей

   Private бакеты:
   - Доступ только для authenticated пользователей
   - Настроить RLS политики при необходимости

3. Ограничения размера файлов:
   - Обложки (workshop-covers, polygon-covers, academy-covers): макс 5MB
   - Видео (academy-videos): макс 100MB
   - Материалы (materials): макс 50MB

4. Допустимые форматы:
   - Обложки: PNG, JPG, JPEG, WebP
   - Видео: MP4, WebM
   - Материалы: PDF, ZIP, DOC, DOCX, любые файлы
*/
