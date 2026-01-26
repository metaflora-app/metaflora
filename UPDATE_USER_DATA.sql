-- ОБНОВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
-- Выполнить в SQL Editor: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/sql

-- Обновить дату подписки на 3 месяца от сегодня (26 января 2026)
-- 26.01.2026 + 3 месяца = 26.04.2026
UPDATE users 
SET 
  subscription_end_date = '2026-04-26 23:59:59+00',
  profile_photo_url = 'https://t.me/i/userpic/320/mishchenko_is.jpg'
WHERE telegram_id = 994500304;

-- Проверить результат
SELECT telegram_id, username, subscription_type, subscription_end_date, profile_photo_url, metacoins_balance
FROM users 
WHERE telegram_id = 994500304;
