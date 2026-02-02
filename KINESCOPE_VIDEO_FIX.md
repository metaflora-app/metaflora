# Исправление загрузки видео из Kinescope

## Проблема
Видео не подгружается в урок академии из Kinescope.

## Причина
В таблице `academy_videos` в Supabase не заполнено поле `video_id` с ID видео из хранилища Kinescope.

## Решение

### Шаг 1: Получить video_id из Kinescope

1. Открыть https://app.kinescope.io
2. Войти в аккаунт
3. Перейти в раздел "Видео" или "Медиатека"
4. Найти нужное видео для урока
5. Скопировать **ID видео** (обычно в формате: `abc123def456`)

### Шаг 2: Обновить таблицу в Supabase

1. Открыть Supabase: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/editor/27206
2. Выбрать таблицу `academy_videos`
3. Найти строку с нужным уроком (по `lesson_id`)
4. В колонке `video_id` вставить ID видео из Kinescope
5. Сохранить изменения

### Пример

Если ID видео в Kinescope: `abc123def456`

То в таблице `academy_videos` должно быть:
```
lesson_id: "урок-1"
video_id: "abc123def456"
title: "Название видео"
is_active: true
```

## Проверка

После обновления:
1. Открыть мини-апп
2. Перейти в Академию
3. Открыть урок
4. Видео должно загрузиться автоматически

## Логи для отладки

В консоли браузера должны появиться логи:
```
📹 Video API response: {data: [...], count: 1}
📹 First video: {video_id: "abc123def456", ...}
📹 video_id: abc123def456
```

Если `video_id` пустой или `undefined` - значит в Supabase не заполнено поле.

---

**Дата:** 2026-02-02
**Статус:** Инструкция готова
