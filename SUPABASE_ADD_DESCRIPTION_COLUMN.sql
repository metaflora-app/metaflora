-- Добавление колонки description в таблицу academy_videos
-- Дата: 2026-02-02
-- Исправление ошибки: Error: column "description" of relation "academy_videos" does not exist

ALTER TABLE academy_videos 
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN academy_videos.description IS 'Описание видео урока';
