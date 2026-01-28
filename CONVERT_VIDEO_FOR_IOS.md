# Конвертация видео для iOS

## Проблема
iOS Safari требует чтобы "moov atom" (метаданные MP4) были в начале файла, а не в конце.

## Решение

### Вариант 1: ffmpeg (локально)

Установи ffmpeg если еще не установлен:
```bash
brew install ffmpeg
```

Затем конвертируй видео:
```bash
cd /Users/user/Desktop/метафлора
ffmpeg -i "src/assets/test-video.mp4" -c copy -movflags +faststart test-video-ios.mp4
```

### Вариант 2: Онлайн конвертер

1. Открой https://www.freeconvert.com/video-converter
2. Загрузи `/Users/user/Desktop/метафлора/src/assets/test-video.mp4`
3. Выбери формат: MP4
4. В Advanced Settings → Выбери "Fast Start: Yes"
5. Скачай результат как `test-video-ios.mp4`

### Вариант 3: HandBrake (GUI приложение)

1. Скачай HandBrake: https://handbrake.fr/
2. Открой `src/assets/test-video.mp4`
3. В настройках видео включи "Web Optimized"
4. Сохрани как `test-video-ios.mp4`

## После конвертации

1. Загрузи `test-video-ios.mp4` в Supabase Storage:
   - Dashboard → Storage → `academy-videos` bucket
   - Upload file

2. Получи публичный URL (будет примерно такой):
   ```
   https://lwjsbflvsmscfrdkejia.supabase.co/storage/v1/object/public/academy-videos/test-video-ios.mp4
   ```

3. Добавь в таблицу `academy_lesson_videos`:
   ```sql
   INSERT INTO academy_lesson_videos (lesson_id, video_url, title)
   VALUES (
     'твой-lesson-id-из-academy_lessons',
     'https://lwjsbflvsmscfrdkejia.supabase.co/storage/v1/object/public/academy-videos/test-video-ios.mp4',
     'Тестовое видео'
   );
   ```

## Проверка

Видео должно:
- Загружаться на iPhone
- Открываться на весь экран при клике на кнопку плей
- Использовать нативный Telegram плеер
