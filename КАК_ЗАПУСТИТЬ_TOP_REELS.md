# Как запустить Top-Reels

## 🔥 Проблема
API возвращает `{"success":true,"reels":[]}` - пустой массив.

**Причина**: Таблица `laba_top_reels` в Supabase пустая.

---

## ✅ Решение 1: Запустить Cron вручную

### Через браузер (РЕКОМЕНДУЕТСЯ):
1. Открой: https://service-production-f0b1.up.railway.app/dashboard/laba
2. Нажми кнопку **"🔄 обновить топ-рилс"** (справа от карточки "профили")
3. Подожди 10-20 секунд
4. Проверь результат: https://web-production-fc84.up.railway.app/laba-main

### Через curl:
```bash
curl "https://service-production-f0b1.up.railway.app/api/cron/update-top-reels"
```

---

## ✅ Решение 2: Заполнить вручную через SQL

Если cron не работает или нужно быстро протестировать:

### 1. Открой Supabase SQL Editor
https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/sql

### 2. Выполни SQL из файла:
`/Users/user/Desktop/metaflora-service/FILL_TOP_REELS_MANUAL.sql`

Или скопируй:

```sql
-- Очищаем старые top-reels
DELETE FROM laba_top_reels;

-- Берем первые 40 reels из laba_reels и делаем их топовыми
INSERT INTO laba_top_reels (reel_id, category, position)
SELECT 
  id as reel_id,
  'нейросети' as category,
  ROW_NUMBER() OVER (ORDER BY created_at DESC) as position
FROM laba_reels
LIMIT 40;

-- Проверяем результат
SELECT COUNT(*) FROM laba_top_reels;
```

### 3. Проверь API:
```bash
curl "https://service-production-f0b1.up.railway.app/api/laba/top-reels?category=нейросети"
```

Должно вернуть массив с 40 reels.

---

## 🔍 Проверка что всё работает

### 1. Проверь API напрямую:
```bash
curl "https://service-production-f0b1.up.railway.app/api/laba/top-reels?category=нейросети" | jq '.reels | length'
```

Должно вернуть: `40`

### 2. Открой мини-апп:
https://web-production-fc84.up.railway.app/laba-main

Должны отображаться 40 карточек reels.

---

## ⚠️ Если всё равно не работает

### Проблема: `laba_reels` тоже пустая
Если в таблице `laba_reels` нет данных, то нечего добавлять в `laba_top_reels`.

**Решение**: Запусти cron который заполнит `laba_reels`:
```bash
curl "https://service-production-f0b1.up.railway.app/api/cron/update-top-reels"
```

Этот cron делает 2 вещи:
1. Парсит reels через Apify (Hashtag scraper)
2. Получает данные профилей (Instagram scraper)
3. Сохраняет в `laba_reels`
4. Добавляет в `laba_top_reels`

### Проблема: Cron падает с ошибкой
Проверь логи Railway:
https://railway.app/project/<project-id>/service/<service-id>/logs

Ищи ошибки типа:
- `null value in column "video_url"` - уже исправлено в коммите `54afcfe`
- `APIFY_API_TOKEN не установлен` - нужно добавить токен в env

---

## 📊 Текущее состояние

**Коммиты**:
- Frontend: `63eedef` (кастомные кнопки + PNG→JPEG)
- Backend: `c207901` (SQL скрипт) + `54afcfe` (fallback для video_url)

**Деплой**:
- ✅ Frontend: https://web-production-fc84.up.railway.app
- ✅ Backend: https://service-production-f0b1.up.railway.app

**Что работает**:
1. ✅ Кастомные кнопки Play/Pause в AboutLabaScreen
2. ✅ PNG→JPEG конвертер для изображений
3. ✅ Fallback для video_url в cron
4. ✅ API эндпоинт `/api/laba/top-reels` работает

**Что нужно сделать**:
1. ⏳ Запустить cron для заполнения `laba_top_reels`
2. ⏳ Проверить что изображения грузятся в Academy/Polygon

---

## 🎯 Быстрый старт

```bash
# 1. Запусти cron
curl "https://service-production-f0b1.up.railway.app/api/cron/update-top-reels"

# 2. Подожди 10-20 секунд

# 3. Проверь результат
curl "https://service-production-f0b1.up.railway.app/api/laba/top-reels?category=нейросети" | jq '.reels | length'

# 4. Открой мини-апп
open "https://web-production-fc84.up.railway.app/laba-main"
```

Готово! 🚀
