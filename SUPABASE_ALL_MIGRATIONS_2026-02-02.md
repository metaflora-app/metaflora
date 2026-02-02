# Все SQL миграции для Supabase - 2026-02-02

## ВАЖНО: Выполнить ВСЕ скрипты по порядку!

### 1. Добавить video_id в academy_videos
```sql
ALTER TABLE academy_videos 
ADD COLUMN IF NOT EXISTS video_id TEXT;

COMMENT ON COLUMN academy_videos.video_id IS 'ID видео из хранилища Kinescope';

CREATE INDEX IF NOT EXISTS idx_academy_videos_video_id ON academy_videos(video_id);
```

### 2. Добавить description в academy_videos
```sql
ALTER TABLE academy_videos 
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN academy_videos.description IS 'Описание видео урока';
```

### 3. Настроить demo_videos (video_id + description + trigger)
```sql
-- Добавляем колонку video_id
ALTER TABLE demo_videos 
ADD COLUMN IF NOT EXISTS video_id TEXT;

COMMENT ON COLUMN demo_videos.video_id IS 'ID видео из хранилища Kinescope';

-- Добавляем колонку description
ALTER TABLE demo_videos 
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN demo_videos.description IS 'Описание видео урока';

-- Создаем индекс
CREATE INDEX IF NOT EXISTS idx_demo_videos_video_id ON demo_videos(video_id);

-- Функция для автоматического создания видео
CREATE OR REPLACE FUNCTION create_demo_video_on_lesson_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO demo_videos (
    lesson_id,
    title,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.title || ' - Видео',
    true,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер
DROP TRIGGER IF EXISTS trigger_create_demo_video ON demo_lessons;

CREATE TRIGGER trigger_create_demo_video
  AFTER INSERT ON demo_lessons
  FOR EACH ROW
  EXECUTE FUNCTION create_demo_video_on_lesson_insert();
```

### 4. Добавить virality_explanation в laba_analysis
```sql
ALTER TABLE laba_analysis 
ADD COLUMN IF NOT EXISTS virality_explanation TEXT;

COMMENT ON COLUMN laba_analysis.virality_explanation IS 'Детальное объяснение оценки виральности';
```

### 5. Добавить is_new и marked_new_at в laba_reels (если еще не сделано)
```sql
ALTER TABLE laba_reels 
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;

ALTER TABLE laba_reels 
ADD COLUMN IF NOT EXISTS marked_new_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_laba_reels_is_new ON laba_reels(is_new) WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_laba_reels_marked_new_at ON laba_reels(marked_new_at) WHERE is_new = true;
```

---

## После выполнения всех миграций:

1. ✅ Видео из Kinescope будут автоматически добавляться в academy_videos и demo_videos
2. ✅ AI анализ будет работать с сохранением virality_explanation
3. ✅ Плашка "новое" будет работать для новых reels
4. ✅ Триггеры будут автоматически создавать записи в _videos при создании уроков

**Дата:** 2026-02-02
**Статус:** Готово к выполнению
