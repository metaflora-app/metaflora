-- Добавление записей в таблицу academy_videos
-- Дата: 2026-02-02
-- Таблица: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/editor/22366?schema=public

-- ИНСТРУКЦИЯ:
-- 1. Сначала узнай lesson_id из таблицы academy_lessons
-- 2. Получи video_id из Kinescope (https://app.kinescope.io)
-- 3. Замени значения ниже и выполни INSERT

-- Пример вставки видео для урока
INSERT INTO academy_videos (
  lesson_id,
  video_id,
  title,
  description,
  duration,
  is_active,
  created_at,
  updated_at
) VALUES (
  'ТВОЙ_LESSON_ID',           -- ID урока из таблицы academy_lessons
  'ТВОЙ_VIDEO_ID_ИЗ_KINESCOPE', -- ID видео из Kinescope (например: abc123def456)
  'Название видео',            -- Название видео
  'Описание видео',            -- Описание (можно NULL)
  0,                           -- Длительность в секундах (можно 0)
  true,                        -- Активно
  NOW(),                       -- Дата создания
  NOW()                        -- Дата обновления
);

-- Если нужно добавить несколько видео сразу:
/*
INSERT INTO academy_videos (lesson_id, video_id, title, is_active, created_at, updated_at) VALUES
  ('урок-1', 'video_id_1', 'Урок 1 - Введение', true, NOW(), NOW()),
  ('урок-2', 'video_id_2', 'Урок 2 - Основы', true, NOW(), NOW()),
  ('урок-3', 'video_id_3', 'Урок 3 - Практика', true, NOW(), NOW());
*/

-- Проверка что видео добавлено:
-- SELECT * FROM academy_videos WHERE lesson_id = 'ТВОЙ_LESSON_ID';
