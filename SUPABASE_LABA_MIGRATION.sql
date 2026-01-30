-- ================================================
-- ЛАБА: МИГРАЦИЯ БАЗЫ ДАННЫХ
-- Дата: 2026-01-30
-- Версия: 1.0
-- ================================================

-- ================================================
-- 1. ТАБЛИЦА: laba_tracked_accounts
-- Отслеживаемые Instagram аккаунты
-- ================================================
CREATE TABLE IF NOT EXISTS laba_tracked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  instagram_username TEXT NOT NULL,
  instagram_user_id TEXT NOT NULL,
  followers_count INTEGER NOT NULL,
  profile_photo_url TEXT,
  tracked_since TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_user_instagram UNIQUE(user_id, instagram_username)
);

CREATE INDEX IF NOT EXISTS idx_tracked_accounts_user ON laba_tracked_accounts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tracked_accounts_active ON laba_tracked_accounts(is_active) WHERE is_active = TRUE;

-- ================================================
-- 2. ТАБЛИЦА: laba_reels
-- Instagram reels (найденные и отслеживаемые)
-- ================================================
CREATE TABLE IF NOT EXISTS laba_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_account_id UUID REFERENCES laba_tracked_accounts(id) ON DELETE SET NULL,
  instagram_reel_id TEXT UNIQUE NOT NULL,
  reel_url TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  caption TEXT,
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMP NOT NULL,
  virality_score FLOAT,
  is_new BOOLEAN DEFAULT FALSE,
  account_username TEXT NOT NULL,
  account_followers INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reels_account ON laba_reels(tracked_account_id);
CREATE INDEX IF NOT EXISTS idx_reels_instagram_id ON laba_reels(instagram_reel_id);
CREATE INDEX IF NOT EXISTS idx_reels_new ON laba_reels(is_new) WHERE is_new = TRUE;
CREATE INDEX IF NOT EXISTS idx_reels_virality ON laba_reels(virality_score) WHERE virality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reels_published ON laba_reels(published_at DESC);

-- ================================================
-- 3. ТАБЛИЦА: laba_analysis
-- ИИ-анализ reels (транскрибация, хук, виральность)
-- ================================================
CREATE TABLE IF NOT EXISTS laba_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES laba_reels(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  virality_score FLOAT NOT NULL,
  hook_text TEXT NOT NULL,
  transcription TEXT NOT NULL,
  video_summary TEXT NOT NULL,
  analyzed_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_reel_user_analysis UNIQUE(reel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_analysis_user ON laba_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reel ON laba_analysis(reel_id);
CREATE INDEX IF NOT EXISTS idx_analysis_date ON laba_analysis(analyzed_at DESC);

-- ================================================
-- 4. ТАБЛИЦА: laba_scenarios
-- Сгенерированные сценарии на основе анализа
-- ================================================
CREATE TABLE IF NOT EXISTS laba_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES laba_analysis(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  scenario_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenarios_user ON laba_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_analysis ON laba_scenarios(analysis_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_date ON laba_scenarios(created_at DESC);

-- ================================================
-- 5. ТАБЛИЦА: laba_favorites
-- Избранные reels пользователя
-- ================================================
CREATE TABLE IF NOT EXISTS laba_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  reel_id UUID NOT NULL REFERENCES laba_reels(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_user_reel_favorite UNIQUE(user_id, reel_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON laba_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_date ON laba_favorites(added_at DESC);

-- ================================================
-- 6. ТАБЛИЦА: laba_top_reels
-- Топ reels для главного экрана (обновляется cron)
-- ================================================
CREATE TABLE IF NOT EXISTS laba_top_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES laba_reels(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'нейросети', 'маркетинг', 'контент'
  position INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_category_position UNIQUE(category, position)
);

CREATE INDEX IF NOT EXISTS idx_top_reels_category ON laba_top_reels(category, position);
CREATE INDEX IF NOT EXISTS idx_top_reels_updated ON laba_top_reels(updated_at DESC);

-- ================================================
-- 7. ТАБЛИЦА: laba_notification_settings
-- Настройки уведомлений пользователей
-- ================================================
CREATE TABLE IF NOT EXISTS laba_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON laba_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_enabled ON laba_notification_settings(enabled) WHERE enabled = TRUE;

-- ================================================
-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ updated_at
-- ================================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для laba_reels
DROP TRIGGER IF EXISTS update_laba_reels_updated_at ON laba_reels;
CREATE TRIGGER update_laba_reels_updated_at
  BEFORE UPDATE ON laba_reels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Триггер для laba_notification_settings
DROP TRIGGER IF EXISTS update_laba_notification_settings_updated_at ON laba_notification_settings;
CREATE TRIGGER update_laba_notification_settings_updated_at
  BEFORE UPDATE ON laba_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Триггер для laba_top_reels
DROP TRIGGER IF EXISTS update_laba_top_reels_updated_at ON laba_top_reels;
CREATE TRIGGER update_laba_top_reels_updated_at
  BEFORE UPDATE ON laba_top_reels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- RLS (ROW LEVEL SECURITY) ПОЛИТИКИ
-- ================================================

-- Включаем RLS для всех таблиц
ALTER TABLE laba_tracked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE laba_reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE laba_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE laba_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE laba_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE laba_top_reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE laba_notification_settings ENABLE ROW LEVEL SECURITY;

-- Политики для laba_tracked_accounts
CREATE POLICY "Users can view their own tracked accounts"
  ON laba_tracked_accounts FOR SELECT
  USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can insert their own tracked accounts"
  ON laba_tracked_accounts FOR INSERT
  WITH CHECK (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can update their own tracked accounts"
  ON laba_tracked_accounts FOR UPDATE
  USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Service role can manage all tracked accounts"
  ON laba_tracked_accounts FOR ALL
  USING (auth.role() = 'service_role');

-- Политики для laba_reels (все могут читать)
CREATE POLICY "Anyone can view reels"
  ON laba_reels FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage all reels"
  ON laba_reels FOR ALL
  USING (auth.role() = 'service_role');

-- Политики для laba_analysis
CREATE POLICY "Users can view their own analysis"
  ON laba_analysis FOR SELECT
  USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can insert their own analysis"
  ON laba_analysis FOR INSERT
  WITH CHECK (auth.uid()::text::bigint = user_id);

CREATE POLICY "Service role can manage all analysis"
  ON laba_analysis FOR ALL
  USING (auth.role() = 'service_role');

-- Политики для laba_scenarios
CREATE POLICY "Users can view their own scenarios"
  ON laba_scenarios FOR SELECT
  USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can insert their own scenarios"
  ON laba_scenarios FOR INSERT
  WITH CHECK (auth.uid()::text::bigint = user_id);

CREATE POLICY "Service role can manage all scenarios"
  ON laba_scenarios FOR ALL
  USING (auth.role() = 'service_role');

-- Политики для laba_favorites
CREATE POLICY "Users can view their own favorites"
  ON laba_favorites FOR SELECT
  USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON laba_favorites FOR INSERT
  WITH CHECK (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON laba_favorites FOR DELETE
  USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Service role can manage all favorites"
  ON laba_favorites FOR ALL
  USING (auth.role() = 'service_role');

-- Политики для laba_top_reels (все могут читать)
CREATE POLICY "Anyone can view top reels"
  ON laba_top_reels FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage all top reels"
  ON laba_top_reels FOR ALL
  USING (auth.role() = 'service_role');

-- Политики для laba_notification_settings
CREATE POLICY "Users can view their own notification settings"
  ON laba_notification_settings FOR SELECT
  USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON laba_notification_settings FOR UPDATE
  USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON laba_notification_settings FOR INSERT
  WITH CHECK (auth.uid()::text::bigint = user_id);

CREATE POLICY "Service role can manage all notification settings"
  ON laba_notification_settings FOR ALL
  USING (auth.role() = 'service_role');

-- ================================================
-- КОММЕНТАРИИ К ТАБЛИЦАМ
-- ================================================

COMMENT ON TABLE laba_tracked_accounts IS 'Отслеживаемые Instagram аккаунты пользователей';
COMMENT ON TABLE laba_reels IS 'Instagram reels - найденные через поиск или из отслеживаемых аккаунтов';
COMMENT ON TABLE laba_analysis IS 'ИИ-анализ reels: транскрибация, хук, виральность';
COMMENT ON TABLE laba_scenarios IS 'Сгенерированные сценарии на основе анализа reels';
COMMENT ON TABLE laba_favorites IS 'Избранные reels пользователей';
COMMENT ON TABLE laba_top_reels IS 'Топ reels для главного экрана (обновляется cron каждые 3 часа)';
COMMENT ON TABLE laba_notification_settings IS 'Настройки уведомлений о новых reels';

-- ================================================
-- ЗАВЕРШЕНО
-- ================================================
-- Все таблицы созданы и готовы к использованию
-- Следующий шаг: создать Storage bucket laba-videos
-- ================================================
