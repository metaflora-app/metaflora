-- Добавление колонок для плашки "новое"
-- Дата: 2026-02-01

-- Таблица laba_reels: добавляем is_new и marked_new_at
ALTER TABLE laba_reels 
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;

ALTER TABLE laba_reels 
ADD COLUMN IF NOT EXISTS marked_new_at TIMESTAMP;

-- Индекс для быстрого поиска новых reels
CREATE INDEX IF NOT EXISTS idx_laba_reels_is_new ON laba_reels(is_new) WHERE is_new = true;

-- Индекс для удаления старых плашек
CREATE INDEX IF NOT EXISTS idx_laba_reels_marked_new_at ON laba_reels(marked_new_at) WHERE is_new = true;

-- Комментарии
COMMENT ON COLUMN laba_reels.is_new IS 'Флаг плашки "новое" (убирается через 24 часа)';
COMMENT ON COLUMN laba_reels.marked_new_at IS 'Время добавления плашки "новое"';
