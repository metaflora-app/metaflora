-- Таблица для хранения прогресса пользователей по урокам академии
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL,
  lesson_id TEXT NOT NULL,
  video_watched BOOLEAN DEFAULT false,
  materials_read BOOLEAN DEFAULT false,
  video_viewed BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(user_id, completed);

-- RLS политики - ОТКЛЮЧАЕМ для anon доступа из мини-аппа
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Политика: anon может читать все (мини-апп работает без auth)
CREATE POLICY "Allow anon to read all progress"
  ON user_progress
  FOR SELECT
  TO anon
  USING (true);

-- Политика: anon может вставлять прогресс
CREATE POLICY "Allow anon to insert progress"
  ON user_progress
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Политика: anon может обновлять прогресс
CREATE POLICY "Allow anon to update progress"
  ON user_progress
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Комментарии
COMMENT ON TABLE user_progress IS 'Прогресс пользователей по урокам академии';
COMMENT ON COLUMN user_progress.user_id IS 'Telegram ID пользователя';
COMMENT ON COLUMN user_progress.lesson_id IS 'ID урока из academy_lessons';
COMMENT ON COLUMN user_progress.video_watched IS 'Видео просмотрено на 80%+';
COMMENT ON COLUMN user_progress.materials_read IS 'Материалы прочитаны на 95%+';
COMMENT ON COLUMN user_progress.video_viewed IS 'Флаг первого просмотра видео (для блюра)';
COMMENT ON COLUMN user_progress.completed IS 'Урок полностью завершен (video_watched AND materials_read)';
