-- Добавление колонки viralityExplanation в таблицу laba_analysis
-- Дата: 2026-02-02

ALTER TABLE laba_analysis 
ADD COLUMN IF NOT EXISTS virality_explanation TEXT;

COMMENT ON COLUMN laba_analysis.virality_explanation IS 'Детальное объяснение оценки виральности';
