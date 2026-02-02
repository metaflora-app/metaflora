-- Автоматическое создание записи в academy_videos при создании урока
-- Дата: 2026-02-02

-- Функция для автоматического создания видео
CREATE OR REPLACE FUNCTION create_academy_video_on_lesson_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Создаем запись в academy_videos для нового урока
  INSERT INTO academy_videos (
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

-- Создаем триггер
DROP TRIGGER IF EXISTS trigger_create_academy_video ON academy_lessons;

CREATE TRIGGER trigger_create_academy_video
  AFTER INSERT ON academy_lessons
  FOR EACH ROW
  EXECUTE FUNCTION create_academy_video_on_lesson_insert();

-- Комментарий
COMMENT ON FUNCTION create_academy_video_on_lesson_insert() IS 'Автоматически создает запись в academy_videos при создании урока';

-- Проверка:
-- 1. Создай новый урок в academy_lessons
-- 2. Проверь что автоматически создалась запись в academy_videos
-- 3. Заполни video_id из Kinescope вручную
