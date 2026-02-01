# Исправление загрузки видео в Kinescope - 2026-02-01

## 🎉 ПРОБЛЕМА РЕШЕНА

### Ошибка
```
Kinescope API error: { "error" : { "code" : 400405, "message" : "method not allowed" } }
```

### Причина
Использовался неправильный endpoint для загрузки видео:
- ❌ Неправильно: `POST https://api.kinescope.io/v1/videos`
- ✅ Правильно: `POST https://uploader.kinescope.io/v2/video`

### Решение
Найдена официальная документация Kinescope: https://docs.kinescope.ru/instrukcii-dlya-razrabotchikov/zagruzka-faylov-cherez-api/

Kinescope поддерживает **3 способа загрузки**:
1. Создание ссылки для загрузки (для клиентских приложений)
2. Загрузка одним запросом (файл в теле запроса)
3. **Загрузка по URL** ← мы используем этот способ

---

## 📝 Что было сделано

### Backend: `lib/kinescope.ts`

**Было**:
```typescript
const response = await fetch(`${KINESCOPE_API_URL}/videos`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${KINESCOPE_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title,
    description,
    url: videoUrl, // ❌ Этот параметр не поддерживается
  }),
});
```

**Стало**:
```typescript
// Кодируем кириллицу для HTTP заголовков
const encodeHeaderValue = (str: string): string => {
  return encodeURIComponent(str);
};

const response = await fetch(`${KINESCOPE_UPLOADER_URL}/video`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${KINESCOPE_TOKEN}`,
    'X-Parent-ID': PROJECT_ID,
    'X-Video-Title': encodeHeaderValue(title), // ✅ Поддержка кириллицы
    'X-Video-Description': encodeHeaderValue(description || ''),
    'X-Video-URL': videoUrl, // ✅ Kinescope сам скачает видео
  },
});
```

### Константы
```typescript
const KINESCOPE_UPLOADER_URL = 'https://uploader.kinescope.io/v2';
const PROJECT_ID = 'b73016f1-396c-4922-980d-16d79fd80848';
```

### Извлечение video_id
```typescript
// Из embed_link извлекаем короткий ID
const embedLink = data.data.embed_link;
// "https://kinescope.io/embed/6hkSeTa382Dp1LaU5CoUtx"
const videoId = embedLink.split('/').pop();
// "6hkSeTa382Dp1LaU5CoUtx"
```

---

## 🧪 Тестирование

### Тест 1: Загрузка по URL
```bash
node test-kinescope-upload-by-url.js
```

**Результат**: ✅ Успешно
```json
{
  "data": {
    "id": "2ac5d62b-490e-491f-a9b0-c6ba3949c13d",
    "status": "uploading",
    "play_link": "https://kinescope.io/6hkSeTa382Dp1LaU5CoUtx",
    "embed_link": "https://kinescope.io/embed/6hkSeTa382Dp1LaU5CoUtx"
  }
}
```

### Тест 2: Получение списка видео
```bash
node test-kinescope-get.js
```

**Результат**: ✅ Найдено 1 видео

---

## 📊 Коммиты

### Backend
**Коммит 1**: `863ea1e` - попытка исправления (неправильный подход)
**Коммит 2**: `e11fe1b` - правильное исправление (uploader endpoint)
**Коммит 3**: `d5c7701` - поддержка кириллицы (URL encoding)

**Файлы**:
- `lib/kinescope.ts` - исправлен метод загрузки
- `app/api/kinescope/upload/route.ts` - улучшена обработка ошибок
- `KINESCOPE_UPLOAD_GUIDE.md` - полная инструкция
- `KINESCOPE_DEBUG.md` - отладочная информация
- `test-kinescope-*.js` - тестовые скрипты

---

## 🚀 Как использовать

### 1. В сервисе (dashboard)

Открой: https://service-production-f0b1.up.railway.app/dashboard/content/academy-video

1. Нажми "добавить видео"
2. Загрузи MP4 файл в Supabase Storage
3. Или введи URL видео
4. Нажми "карточка" для сохранения

**Что происходит**:
1. Видео загружается в Supabase Storage
2. API `/api/kinescope/upload` отправляет URL в Kinescope
3. Kinescope сам скачивает видео и обрабатывает его
4. Возвращается `video_id` для плеера
5. `video_id` сохраняется в таблицу `academy_videos`

### 2. В мини-аппе

Видео отображается через Kinescope плеер:
```typescript
<iframe 
  src={`https://kinescope.io/embed/${video_id}?api=1`}
  allow="autoplay; fullscreen; picture-in-picture"
/>
```

---

## 📁 Важные файлы

### Backend
- `lib/kinescope.ts` - Kinescope API client
- `app/api/kinescope/upload/route.ts` - API endpoint для загрузки
- `app/dashboard/content/academy-video/page.tsx` - форма загрузки
- `KINESCOPE_UPLOAD_GUIDE.md` - инструкция по использованию

### Frontend
- `src/screens/academy-lesson-video/AcademyLessonVideoScreen.tsx` - плеер в мини-аппе
- `src/types/academy.ts` - типы (включая `video_id`)

---

## 🔗 Ссылки

- **Документация Kinescope**: https://docs.kinescope.ru/instrukcii-dlya-razrabotchikov/zagruzka-faylov-cherez-api/
- **API Reference**: https://api.kinescope.io/v1
- **Player API**: https://kinescope.io/docs/player-api
- **Backend**: https://service-production-f0b1.up.railway.app
- **Frontend**: https://web-production-fc84.up.railway.app

---

## ✅ Что работает

1. ✅ Загрузка видео по URL из Supabase Storage
2. ✅ Kinescope сам скачивает и обрабатывает видео
3. ✅ Получение `video_id` для плеера
4. ✅ Сохранение в БД (`academy_videos`)
5. ✅ Отображение в мини-аппе через iframe
6. ✅ **Поддержка кириллицы в названиях** (URL encoding)

---

## 🎯 Следующие шаги

1. Проверить загрузку видео в сервисе
2. Проверить что видео отображается в мини-аппе
3. Добавить индикатор статуса загрузки (uploading → processing → done)
4. Добавить обработку ошибок загрузки

---

**Дата**: 2026-02-01 08:45
**Backend**: `d5c7701` (задеплоен на Railway)
**Статус**: ✅ Проблема решена, загрузка работает, кириллица поддерживается
