-- Добавление колонки video_id в таблицу academy_videos
-- Дата: 2026-02-02
-- Таблица: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/editor/22366?schema=public

-- Добавляем колонку video_id для хранения ID видео из Kinescope
ALTER TABLE academy_videos 
ADD COLUMN IF NOT EXISTS video_id TEXT;

-- Добавляем комментарий
COMMENT ON COLUMN academy_videos.video_id IS 'ID видео из хранилища Kinescope (например: abc123def456)';

-- Создаем индекс для быстрого поиска по video_id
CREATE INDEX IF NOT EXISTS idx_academy_videos_video_id ON academy_videos(video_id);
