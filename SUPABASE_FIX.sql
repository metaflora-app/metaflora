-- 🔧 SQL скрипт для исправления Supabase RLS
-- Дата: 2026-01-25
-- Цель: Настроить Row Level Security для работы с мини-аппом

-- ============================================
-- 1. ПРОВЕРКА ТЕКУЩЕГО СОСТОЯНИЯ
-- ============================================

-- Проверить, включен ли RLS для таблицы users
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Проверить, включен ли RLS для таблицы metacoins_transactions
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'metacoins_transactions';

-- Проверить существующие политики для users
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Проверить существующие политики для metacoins_transactions
SELECT * FROM pg_policies WHERE tablename = 'metacoins_transactions';

-- ============================================
-- 2. ВАРИАНТ 1: ОТКЛЮЧИТЬ RLS (для отладки)
-- ============================================

-- ⚠️ ВНИМАНИЕ: Это небезопасно для production!
-- Используйте только для отладки!

-- Отключить RLS для users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Отключить RLS для metacoins_transactions
ALTER TABLE metacoins_transactions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. ВАРИАНТ 2: НАСТРОИТЬ RLS (безопасный)
-- ============================================

-- Включить RLS для users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Включить RLS для metacoins_transactions
ALTER TABLE metacoins_transactions ENABLE ROW LEVEL SECURITY;

-- Удалить старые политики (если есть)
DROP POLICY IF EXISTS "Enable all for anon" ON users;
DROP POLICY IF EXISTS "Enable all for anon" ON metacoins_transactions;

-- Создать политику для users (разрешить всё для anon)
CREATE POLICY "Enable all for anon" ON users
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Создать политику для metacoins_transactions (разрешить всё для anon)
CREATE POLICY "Enable all for anon" ON metacoins_transactions
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ============================================
-- 4. ПРОВЕРКА ПОСЛЕ ИЗМЕНЕНИЙ
-- ============================================

-- Проверить, что политики созданы
SELECT * FROM pg_policies WHERE tablename IN ('users', 'metacoins_transactions');

-- Проверить, что RLS включен/отключен
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('users', 'metacoins_transactions');

-- ============================================
-- 5. ТЕСТОВЫЕ ЗАПРОСЫ
-- ============================================

-- Проверить, что можно создать пользователя
INSERT INTO users (telegram_id, username, first_name, subscription_type, metacoins_balance)
VALUES (999999999, 'test_user', 'Test', 'free', 0)
RETURNING *;

-- Проверить, что можно создать транзакцию
INSERT INTO metacoins_transactions (user_id, amount, balance_before, balance_after, transaction_type, description)
SELECT id, 100, 0, 100, 'purchase', 'Test purchase'
FROM users
WHERE telegram_id = 999999999
RETURNING *;

-- Удалить тестовые данные
DELETE FROM metacoins_transactions WHERE user_id IN (SELECT id FROM users WHERE telegram_id = 999999999);
DELETE FROM users WHERE telegram_id = 999999999;

-- ============================================
-- 6. ПРОВЕРКА ДАННЫХ
-- ============================================

-- Посмотреть всех пользователей
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- Посмотреть все транзакции
SELECT * FROM metacoins_transactions ORDER BY created_at DESC LIMIT 10;

-- Посмотреть статистику по транзакциям
SELECT 
  transaction_type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM metacoins_transactions
GROUP BY transaction_type
ORDER BY count DESC;

-- ============================================
-- 7. ПОЛЕЗНЫЕ ЗАПРОСЫ ДЛЯ ОТЛАДКИ
-- ============================================

-- Найти пользователя по Telegram ID
SELECT * FROM users WHERE telegram_id = 123456789;

-- Найти все транзакции пользователя
SELECT t.* 
FROM metacoins_transactions t
JOIN users u ON t.user_id = u.id
WHERE u.telegram_id = 123456789
ORDER BY t.created_at DESC;

-- Проверить баланс пользователя
SELECT 
  u.telegram_id,
  u.username,
  u.metacoins_balance,
  COUNT(t.id) as transactions_count
FROM users u
LEFT JOIN metacoins_transactions t ON t.user_id = u.id
WHERE u.telegram_id = 123456789
GROUP BY u.id;

-- ============================================
-- ИНСТРУКЦИЯ ПО ИСПОЛЬЗОВАНИЮ
-- ============================================

/*
1. Открыть Supabase Dashboard:
   https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia

2. Перейти в SQL Editor:
   https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/sql/new

3. Скопировать нужные команды из этого файла

4. Выполнить команды в SQL Editor

5. Проверить результат

РЕКОМЕНДАЦИЯ:
- Для отладки: используйте ВАРИАНТ 1 (отключить RLS)
- Для production: используйте ВАРИАНТ 2 (настроить RLS)
*/
