-- МИГРАЦИЯ: Добавление таблицы для видео уроков академии
-- Выполнить в SQL Editor: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/sql

-- 1. Создать таблицу academy_lesson_videos
CREATE TABLE IF NOT EXISTS academy_lesson_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  title TEXT,
  duration INTEGER, -- длительность в секундах
  thumbnail_url TEXT, -- URL превью кадра
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Добавить комментарии
COMMENT ON TABLE academy_lesson_videos IS 'Видео для уроков академии (academy и demo)';
COMMENT ON COLUMN academy_lesson_videos.lesson_id IS 'ID урока из academy_lessons или demo_lessons';
COMMENT ON COLUMN academy_lesson_videos.video_url IS 'URL видео в Supabase Storage';
COMMENT ON COLUMN academy_lesson_videos.duration IS 'Длительность видео в секундах';
COMMENT ON COLUMN academy_lesson_videos.thumbnail_url IS 'URL превью кадра (poster)';

-- 3. Создать индекс для быстрого поиска по lesson_id
CREATE INDEX IF NOT EXISTS idx_academy_lesson_videos_lesson_id ON academy_lesson_videos(lesson_id);
CREATE INDEX IF NOT EXISTS idx_academy_lesson_videos_active ON academy_lesson_videos(is_active);

-- 4. Включить Row Level Security (RLS)
ALTER TABLE academy_lesson_videos ENABLE ROW LEVEL SECURITY;

-- 5. Создать политику для публичного чтения
CREATE POLICY "Публичный доступ к видео"
  ON academy_lesson_videos
  FOR SELECT
  USING (is_active = true);

-- 6. Создать Storage bucket для видео (если еще не создан)
-- Выполнить в Dashboard -> Storage -> Create bucket
-- Название: academy-videos
-- Public: true

-- ГОТОВО! Теперь:
-- 1. Загрузи test-video.mp4 в Storage bucket "academy-videos"
-- 2. Получи публичный URL
-- 3. Добавь запись в academy_lesson_videos:
/*
INSERT INTO academy_lesson_videos (lesson_id, video_url, title, thumbnail_url)
VALUES (
  'lesson-uuid-here',
  'https://lwjsbflvsmscfrdkejia.supabase.co/storage/v1/object/public/academy-videos/test-video.mp4',
  'Тестовое видео',
  'https://lwjsbflvsmscfrdkejia.supabase.co/storage/v1/object/public/academy-videos/test-video-thumb.jpg'
);
*/
