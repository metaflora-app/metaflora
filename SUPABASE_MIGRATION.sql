-- МИГРАЦИЯ SUPABASE: Добавление колонок для пользовательских данных
-- Выполнить в SQL Editor: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/sql

-- 1. Добавить колонку для даты окончания подписки
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- 2. Добавить колонку для URL фото профиля
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- 3. Добавить комментарии
COMMENT ON COLUMN users.subscription_end_date IS 'Дата окончания подписки (отображается в формате DD.MM)';
COMMENT ON COLUMN users.profile_photo_url IS 'URL фото профиля из Telegram (автоматически обрезается и скругляется)';

-- 4. Обновить тестового пользователя (опционально)
UPDATE users 
SET 
  subscription_end_date = '2025-12-31 23:59:59+00',
  profile_photo_url = 'https://via.placeholder.com/159'
WHERE telegram_id = 994500304;

-- ГОТОВО! Теперь мини-апп будет подгружать:
-- - username (с @ в начале)
-- - subscription_end_date (в формате DD.MM)
-- - profile_photo_url (автоматически обрезается до 159x159px и скругляется)
