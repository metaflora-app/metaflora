-- ============================================
-- ДОБАВЛЕНИЕ КОЛОНКИ content_blocks
-- ============================================
-- Дата: 2026-01-27
-- Описание: Добавляет поле content_blocks для Notion-like редактора

-- 1. Добавить колонку content_blocks
ALTER TABLE polygon_articles
ADD COLUMN IF NOT EXISTS content_blocks JSONB;

-- 2. Создать индекс для быстрого поиска (опционально)
CREATE INDEX IF NOT EXISTS idx_polygon_articles_content_blocks 
ON polygon_articles USING GIN (content_blocks);

-- 3. Комментарий к колонке
COMMENT ON COLUMN polygon_articles.content_blocks IS 
'Массив блоков контента в формате JSON: [{id, type, content}]. Типы: text, image, materials, prompt';

-- ============================================
-- ПРОВЕРКА
-- ============================================
-- Проверить что колонка добавлена:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'polygon_articles' AND column_name = 'content_blocks';

-- ============================================
-- МИГРАЦИЯ СТАРЫХ ДАННЫХ (если нужно)
-- ============================================
-- Если есть старые статьи с content_text, video_url, prompt_text
-- можно мигрировать их в content_blocks:
/*
UPDATE polygon_articles
SET content_blocks = (
  SELECT jsonb_agg(block)
  FROM (
    SELECT 
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'text',
        'content', content_text
      ) as block
    WHERE content_text IS NOT NULL
    UNION ALL
    SELECT 
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'prompt',
        'content', prompt_text
      ) as block
    WHERE prompt_text IS NOT NULL
  ) blocks
)
WHERE content_blocks IS NULL 
  AND (content_text IS NOT NULL OR prompt_text IS NOT NULL);
*/
