# 🔧 ЛАБА: РЕШЕНИЕ ПРОБЛЕМ

**Дата:** 2026-01-30  
**Статус:** API endpoints работают, но возвращают ошибки  
**Проблема:** Не настроены environment variables на Railway

---

## ❌ ТЕКУЩИЕ ОШИБКИ

### Проверка API:
```bash
# Топ reels - работает, но пустой массив
curl "https://service-production-f0b1.up.railway.app/api/laba/top-reels?category=нейросети"
# → {"success":true,"reels":[]}

# Поиск reels - ошибка
curl -X POST "https://service-production-f0b1.up.railway.app/api/laba/search-reels" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"нейросети","userId":994500304}'
# → {"success":false,"error":"ошибка поиска reels"}

# Поиск аккаунта - ошибка
curl -X POST "https://service-production-f0b1.up.railway.app/api/laba/search-account" \
  -H "Content-Type: application/json" \
  -d '{"query":"@mishchenko.is"}'
# → {"success":false,"error":"ошибка поиска аккаунта"}
```

---

## 🔐 РЕШЕНИЕ: ДОБАВИТЬ ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ

### Сервис (service-production-f0b1)

Зайти в Railway Dashboard → metaflora-service → Variables и добавить:

#### 1. Supabase (обязательно)
```
VITE_SUPABASE_URL=https://lwjsbflvsmscfrdkejia.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anNiZmx2c21zY2ZyZGtlamlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjgzMjEsImV4cCI6MjA4NDYwNDMyMX0.sf_9yMijf066geuGGjv0ylxRxKueaaC2J9u5z6Xa6sI
```

#### 2. Apify (обязательно для парсинга Instagram)
```
APIFY_API_TOKEN=apify_api_ВАШ_ТОКЕН
```

**Где взять:**
1. Зайти на https://console.apify.com/account/integrations
2. Скопировать "Personal API token"

#### 3. OpenAI (обязательно для транскрибации видео)
```
OPENAI_API_KEY=sk-proj-ВАШ_КЛЮЧ
```

**Где взять:**
1. Зайти на https://platform.openai.com/api-keys
2. Create new secret key
3. **Важно:** Пополнить баланс $5-10 → https://platform.openai.com/settings/billing

#### 4. OpenRouter (обязательно для ИИ-анализа)
```
OPENROUTER_API_KEY=sk-or-v1-ВАШ_КЛЮЧ
```

**Где взять:**
1. Зайти на https://openrouter.ai/settings/keys
2. Create Key
3. **Важно:** Пополнить баланс $5-10 → https://openrouter.ai/settings/billing

#### 5. Telegram Bot (опционально, для уведомлений)
```
TELEGRAM_BOT_TOKEN=7810577330:ВАШ_ТОКЕН
```

**Где взять:**
1. Написать @BotFather в Telegram
2. Создать бота или использовать существующий
3. Скопировать токен

---

### Мини-апп (web-production-fc84)

Зайти в Railway Dashboard → metaflora → Variables и добавить:

```
VITE_API_URL=https://service-production-f0b1.up.railway.app
```

Это опционально, так как в коде уже есть fallback на этот URL.

---

## 🚀 ПОСЛЕ ДОБАВЛЕНИЯ ПЕРЕМЕННЫХ

### 1. Перезапустить сервис
Railway автоматически перезапустит после добавления переменных.

### 2. Подождать 2-3 минуты
Сервису нужно время на перезапуск.

### 3. Проверить что API работает
```bash
# Должно вернуть пустой массив (это нормально)
curl "https://service-production-f0b1.up.railway.app/api/laba/top-reels?category=нейросети"

# Должно найти reels (если Apify настроен)
curl -X POST "https://service-production-f0b1.up.railway.app/api/laba/search-reels" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"нейросети","userId":994500304}'

# Должно найти аккаунт (если Apify настроен)
curl -X POST "https://service-production-f0b1.up.railway.app/api/laba/search-account" \
  -H "Content-Type: application/json" \
  -d '{"query":"mishchenko.is"}'
```

### 4. Запустить cron задачу для топ reels
```bash
curl "https://service-production-f0b1.up.railway.app/api/cron/update-top-reels"
```

Это заполнит базу топ reels для главного экрана.

### 5. Проверить в мини-аппе
Откройте https://web-production-fc84.up.railway.app и проверьте:
- Загружаются ли топ reels на главном экране
- Работает ли поиск
- Работает ли поиск аккаунтов

---

## 📊 ПРОВЕРКА БАЛАНСОВ API

### Apify
- Dashboard: https://console.apify.com/billing
- Plan: Free tier (5,000 runs/месяц)
- Нужно: ✅ Free tier достаточно

### OpenAI
- Dashboard: https://platform.openai.com/settings/organization/billing/overview
- Баланс: должен быть > $5
- Нужно: $5-10 для тестирования

### OpenRouter
- Dashboard: https://openrouter.ai/settings/billing
- Баланс: должен быть > $5
- Нужно: $5-10 для тестирования

---

## 🐛 ВОЗМОЖНЫЕ ОШИБКИ

### Ошибка: "недостаточно метакоинов"
**Причина:** У пользователя недостаточно метакоинов  
**Решение:**
```sql
-- Пополнить через Supabase SQL Editor
UPDATE users 
SET metacoins_balance = 50000 
WHERE telegram_id = 994500304;
```

### Ошибка: "ошибка поиска reels"
**Причины:**
1. APIFY_API_TOKEN не настроен
2. APIFY_API_TOKEN неверный
3. Apify free tier исчерпан

**Решение:**
1. Проверить что APIFY_API_TOKEN добавлен в Railway
2. Проверить баланс Apify: https://console.apify.com/billing
3. Проверить логи сервиса: Railway → metaflora-service → Logs

### Ошибка: "ошибка поиска аккаунта"
**То же что и для "ошибка поиска reels"**

### Ошибка: "ошибка анализа"
**Причины:**
1. OPENAI_API_KEY не настроен (Whisper)
2. OPENROUTER_API_KEY не настроен (GPT-4o-mini)
3. Недостаточно средств на OpenAI или OpenRouter

**Решение:**
1. Проверить что оба ключа добавлены в Railway
2. Пополнить балансы ($5-10 на каждый)
3. Проверить логи сервиса

---

## 📝 ЧЕКЛИСТ НАСТРОЙКИ

### Backend (сервис):
- [ ] VITE_SUPABASE_URL добавлен
- [ ] VITE_SUPABASE_ANON_KEY добавлен
- [ ] APIFY_API_TOKEN добавлен
- [ ] OPENAI_API_KEY добавлен
- [ ] OPENROUTER_API_KEY добавлен
- [ ] TELEGRAM_BOT_TOKEN добавлен (опционально)
- [ ] Сервис перезапущен
- [ ] API endpoints возвращают данные

### Frontend (мини-апп):
- [ ] VITE_API_URL добавлен (опционально)
- [ ] Мини-апп задеплоен с исправлением URL
- [ ] Открывается в браузере
- [ ] Загружаются топ reels

### API балансы:
- [ ] OpenAI пополнен ($5-10)
- [ ] OpenRouter пополнен ($5-10)
- [ ] Apify - free tier (достаточно)

### База данных:
- [ ] SQL миграция применена (7 таблиц)
- [ ] Storage bucket `laba-videos` создан
- [ ] У пользователя 994500304 есть метакоины

---

## 🔗 ПОЛЕЗНЫЕ ССЫЛКИ

### Railway:
- Сервис: https://railway.app/project/YOUR_PROJECT_ID
- Мини-апп: https://railway.app/project/YOUR_PROJECT_ID
- Логи: Нажать на сервис → Logs

### API Keys:
- Apify: https://console.apify.com/account/integrations
- OpenAI: https://platform.openai.com/api-keys
- OpenRouter: https://openrouter.ai/settings/keys

### Billing:
- OpenAI: https://platform.openai.com/settings/billing
- OpenRouter: https://openrouter.ai/settings/billing
- Apify: https://console.apify.com/billing

### Supabase:
- Dashboard: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia
- SQL Editor: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/sql
- Storage: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/storage

---

**После настройки всех переменных лаба должна заработать! 🚀**
