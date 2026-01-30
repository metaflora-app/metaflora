-- ================================================
-- ПРОВЕРКА RLS (Row Level Security) ДЛЯ ЛАБЫ
-- Дата: 2026-01-30
-- ================================================

-- Проверить включен ли RLS на таблицах лабы
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'laba_%'
ORDER BY tablename;

-- Проверить политики RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'laba_%'
ORDER BY tablename, policyname;

-- ================================================
-- РЕШЕНИЕ: ОТКЛЮЧИТЬ RLS ДЛЯ ТЕСТИРОВАНИЯ
-- ================================================

-- Выполнить если RLS блокирует INSERT:

ALTER TABLE laba_tracked_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE laba_reels DISABLE ROW LEVEL SECURITY;
ALTER TABLE laba_analysis DISABLE ROW LEVEL SECURITY;
ALTER TABLE laba_scenarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE laba_favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE laba_top_reels DISABLE ROW LEVEL SECURITY;
ALTER TABLE laba_notification_settings DISABLE ROW LEVEL SECURITY;

-- ================================================
-- ИЛИ: НАСТРОИТЬ ПОЛИТИКИ ПРАВИЛЬНО (Production)
-- ================================================

-- Разрешить все операции для anon роли:

-- laba_reels
CREATE POLICY "Enable all for anon" ON laba_reels
FOR ALL USING (true) WITH CHECK (true);

-- laba_tracked_accounts
CREATE POLICY "Enable all for anon" ON laba_tracked_accounts
FOR ALL USING (true) WITH CHECK (true);

-- laba_analysis
CREATE POLICY "Enable all for anon" ON laba_analysis
FOR ALL USING (true) WITH CHECK (true);

-- laba_scenarios
CREATE POLICY "Enable all for anon" ON laba_scenarios
FOR ALL USING (true) WITH CHECK (true);

-- laba_favorites
CREATE POLICY "Enable all for anon" ON laba_favorites
FOR ALL USING (true) WITH CHECK (true);

-- laba_top_reels
CREATE POLICY "Enable all for anon" ON laba_top_reels
FOR ALL USING (true) WITH CHECK (true);

-- laba_notification_settings
CREATE POLICY "Enable all for anon" ON laba_notification_settings
FOR ALL USING (true) WITH CHECK (true);
