-- УДАЛЕНИЕ ТРИГГЕРА sync_lesson_files_trigger
-- Выполнить в: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/sql

-- 1. Удалить триггер
DROP TRIGGER IF EXISTS sync_lesson_files_trigger ON academy_lessons;

-- 2. Удалить функцию триггера (если существует)
DROP FUNCTION IF EXISTS sync_lesson_files();

-- 3. Проверить что триггер удален
SELECT tgname, tgrelid::regclass, proname
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'academy_lessons'::regclass;

-- Если результат пустой - триггер успешно удален!
