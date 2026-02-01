# Как протестировать загрузку видео в Kinescope

## ✅ Исправление задеплоено

**Backend коммит**: `e11fe1b`
**Railway**: https://service-production-f0b1.up.railway.app

---

## 🧪 Тест 1: Загрузка через форму

### Шаги:

1. Открой сервис: https://service-production-f0b1.up.railway.app/dashboard/content/academy-video

2. **Добавь заголовок**:
   - Нажми кнопку "открыть"
   - Введи название: "Тестовое видео"

3. **Добавь видео**:
   - Нажми кнопку "открыть"
   - **Вариант А**: Загрузи MP4 файл (он сохранится в Supabase)
   - **Вариант Б**: Введи URL видео (например, из Supabase Storage)

4. **Сохрани**:
   - Нажми кнопку "карточка"
   - Должно появиться сообщение: "Видео сохранено в Kinescope!"

### Ожидаемый результат:

✅ Видео загружено в Kinescope
✅ Получен Video ID
✅ Сохранено в таблицу `academy_videos`

### Если ошибка:

1. Открой DevTools (F12) → Console
2. Скопируй текст ошибки
3. Проверь логи Railway:
   - Открой https://railway.app
   - Найди проект `metaflora-service`
   - Вкладка "Deployments" → "View Logs"

---

## 🧪 Тест 2: Проверка через API

### Curl запрос:

```bash
curl -X POST https://service-production-f0b1.up.railway.app/api/kinescope/upload \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    "title": "Test Video",
    "description": "Test description"
  }'
```

### Ожидаемый ответ:

```json
{
  "success": true,
  "videoId": "6hkSeTa382Dp1LaU5CoUtx",
  "embedUrl": "https://kinescope.io/embed/6hkSeTa382Dp1LaU5CoUtx",
  "message": "Видео успешно загружено в Kinescope"
}
```

---

## 🧪 Тест 3: Проверка в мини-аппе

### Шаги:

1. Открой мини-апп: https://web-production-fc84.up.railway.app

2. Перейди в Академию

3. Открой урок с видео

4. Видео должно отображаться через Kinescope плеер

### Ожидаемый результат:

✅ Видео загружается
✅ Кнопка Play работает
✅ Видео воспроизводится

---

## 🔍 Отладка

### Проверить статус видео в Kinescope:

```bash
curl https://api.kinescope.io/v1/videos/{video_id} \
  -H "Authorization: Bearer e7dc4869-562f-492a-811b-506296b20fb7"
```

### Проверить таблицу academy_videos в Supabase:

```sql
SELECT * FROM academy_videos ORDER BY created_at DESC LIMIT 5;
```

### Проверить логи Railway:

1. Открой https://railway.app
2. Проект `metaflora-service`
3. Deployments → View Logs
4. Ищи строки с "🎬 Загружаем видео в Kinescope"

---

## 📋 Чеклист

- [ ] Форма загрузки открывается
- [ ] Можно загрузить файл в Supabase
- [ ] Можно ввести URL видео
- [ ] Кнопка "карточка" работает
- [ ] Появляется сообщение об успехе
- [ ] Видео отображается в мини-аппе
- [ ] Видео воспроизводится

---

## 🚨 Возможные проблемы

### Ошибка "method not allowed"
**Причина**: Старая версия кода не задеплоилась
**Решение**: Проверить коммит на Railway, перезапустить деплой

### Ошибка "unauthorized"
**Причина**: Неверный API токен
**Решение**: Проверить переменную `KINESCOPE_TOKEN` в Railway

### Видео не грузится в мини-аппе
**Причина**: Неверный `video_id` или видео еще обрабатывается
**Решение**: Проверить статус видео в Kinescope API

### URL недоступен для Kinescope
**Причина**: URL требует авторизации или недоступен извне
**Решение**: Убедиться что URL публичный (Supabase Storage bucket должен быть public)

---

## 📄 Документация

- **Исправление**: `KINESCOPE_FIX_2026-02-01.md`
- **Инструкция**: `KINESCOPE_UPLOAD_GUIDE.md` (в backend)
- **Отладка**: `KINESCOPE_DEBUG.md` (в backend)
- **Официальная документация**: https://docs.kinescope.ru/instrukcii-dlya-razrabotchikov/zagruzka-faylov-cherez-api/

---

**Дата**: 2026-02-01 08:40
**Статус**: Готово к тестированию
