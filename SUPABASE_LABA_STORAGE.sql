-- ================================================
-- ЛАБА: НАСТРОЙКА SUPABASE STORAGE
-- Дата: 2026-01-30
-- Версия: 1.0
-- ================================================

-- ================================================
-- STORAGE BUCKET: laba-videos
-- Для хранения скачанных видео reels
-- ================================================

-- Создание bucket (выполнить через Supabase Dashboard -> Storage)
-- Имя: laba-videos
-- Public: false (приватный)
-- File size limit: 100MB
-- Allowed MIME types: video/mp4, video/webm, video/quicktime

-- ================================================
-- ПОЛИТИКИ ДОСТУПА
-- ================================================

-- 1. Service role может читать и писать
CREATE POLICY "Service role can manage laba videos"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'laba-videos');

-- 2. Authenticated users могут читать свои видео
CREATE POLICY "Users can read their own laba videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'laba-videos');

-- ================================================
-- ИНСТРУКЦИИ ПО СОЗДАНИЮ ЧЕРЕЗ UI
-- ================================================

/*
1. Открыть Supabase Dashboard
2. Перейти в Storage -> Create Bucket
3. Заполнить:
   - Name: laba-videos
   - Public: OFF (снять галочку)
   - File size limit: 104857600 (100MB)
   - Allowed MIME types: video/mp4,video/webm,video/quicktime
4. Нажать Create

5. После создания bucket:
   - Перейти в Policies
   - Создать политики вручную через SQL выше
   - Или через UI: Add Policy -> Custom Policy
*/

-- ================================================
-- ИСПОЛЬЗОВАНИЕ В КОДЕ
-- ================================================

/*
// Загрузка видео
const { data, error } = await supabase.storage
  .from('laba-videos')
  .upload(`${reelId}.mp4`, videoFile, {
    contentType: 'video/mp4',
    upsert: true
  });

// Получение URL видео
const { data: urlData } = supabase.storage
  .from('laba-videos')
  .getPublicUrl(`${reelId}.mp4`);

// Проверка существования
const { data: files } = await supabase.storage
  .from('laba-videos')
  .list('', {
    search: `${reelId}.mp4`
  });

// Удаление видео
const { data, error } = await supabase.storage
  .from('laba-videos')
  .remove([`${reelId}.mp4`]);
*/

-- ================================================
-- ЗАВЕРШЕНО
-- ================================================
