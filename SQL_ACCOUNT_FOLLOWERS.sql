-- ================================================
-- ДОБАВИТЬ КОЛОНКУ account_followers В laba_reels
-- Дата: 2026-01-30
-- ================================================

-- Добавить колонку для количества подписчиков аккаунта
ALTER TABLE laba_reels 
ADD COLUMN IF NOT EXISTS account_followers BIGINT DEFAULT 0;

-- Проверка
SELECT id, account_username, account_followers, account_profile_pic_url 
FROM laba_reels 
LIMIT 5;
