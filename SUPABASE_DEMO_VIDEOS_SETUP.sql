-- Настройка таблицы demo_videos аналогично academy_videos
-- Дата: 2026-02-02
-- Таблица: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/editor/24821?schema=public

-- 1. Добавляем колонку video_id для Kinescope
ALTER TABLE demo_videos 
ADD COLUMN IF NOT EXISTS video_id TEXT;

COMMENT ON COLUMN demo_videos.video_id IS 'ID видео из хранилища Kinescope (например: abc123def456)';

-- 2. Добавляем колонку description
ALTER TABLE demo_videos 
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN demo_videos.description IS 'Описание видео урока';

-- 3. Создаем индекс для быстрого поиска по video_id
CREATE INDEX IF NOT EXISTS idx_demo_videos_video_id ON demo_videos(video_id);

-- 4. Функция для автоматического создания видео при создании demo урока
CREATE OR REPLACE FUNCTION create_demo_video_on_lesson_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Создаем запись в demo_videos для нового урока
  INSERT INTO demo_videos (
    lesson_id,
    title,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,                                    -- ID нового урока
    NEW.title || ' - Видео',                  -- Название = название урока + "- Видео"
    true,                                      -- Активно
    NOW(),                                     -- Дата создания
    NOW()                                      -- Дата обновления
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Создаем триггер
DROP TRIGGER IF EXISTS trigger_create_demo_video ON demo_lessons;

CREATE TRIGGER trigger_create_demo_video
  AFTER INSERT ON demo_lessons
  FOR EACH ROW
  EXECUTE FUNCTION create_demo_video_on_lesson_insert();

-- Комментарий
COMMENT ON FUNCTION create_demo_video_on_lesson_insert() IS 'Автоматически создает запись в demo_videos при создании demo урока';

-- Проверка:
-- SELECT * FROM demo_videos;
