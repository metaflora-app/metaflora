# 🔥 КРИТИЧНО: ДОБАВИТЬ ПЕРЕМЕННЫЕ НА RAILWAY

**Проблема:** `VITE_*` переменные НЕ работают в Next.js на сервере!

**Ошибка:** `Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL`

---

## ✅ ЧТО НУЖНО СДЕЛАТЬ

### Зайти в Railway Variables

1. Откройте: https://railway.app/dashboard
2. Выберите проект **service** (metaflora-service.ru)
3. Перейдите в **Variables**
4. Нажмите **+ New Variable**

---

## 📝 ДОБАВИТЬ ЭТИ 2 ПЕРЕМЕННЫЕ:

### 1. SUPABASE_URL (без префикса!)
```
SUPABASE_URL=https://lwjsbflvsmscfrdkejia.supabase.co
```

### 2. SUPABASE_ANON_KEY (без префикса!)
```
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anNiZmx2c21zY2ZyZGtlamlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjgzMjEsImV4cCI6MjA4NDYwNDMyMX0.sf_9yMijf066geuGGjv0ylxRxKueaaC2J9u5z6Xa6sI
```

---

## ⚠️ ВАЖНО

**НЕ удаляйте** существующие переменные `VITE_*` - они нужны для других частей проекта.

**ДОБАВЬТЕ** новые без префикса.

**Итого у вас будет:**
```
✅ APIFY_API_TOKEN
✅ OPENAI_API_KEY  
✅ OPENROUTER_API_KEY
✅ TELEGRAM_BOT_TOKEN
✅ CRON_SECRET
✅ VITE_SUPABASE_URL (оставить)
✅ VITE_SUPABASE_ANON_KEY (оставить)
✅ SUPABASE_URL (ДОБАВИТЬ!)
✅ SUPABASE_ANON_KEY (ДОБАВИТЬ!)
```

---

## ⏳ ПОСЛЕ ДОБАВЛЕНИЯ

1. Railway автоматически перезапустит сервис (2-3 минуты)
2. Деплой коммита `48c6026` завершится
3. Проверьте логи что ошибка пропала

---

## 🔍 ПРОВЕРКА

После перезапуска выполните:

```bash
curl -X POST "https://service-production-f0b1.up.railway.app/api/laba/search-reels" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"тест","userId":994500304}'
```

**Должно вернуться:** `{"success":true,"reels":[...]}`

---

## 📊 ПОЧЕМУ ТАК?

**Next.js на сервере:**
- ✅ Читает `process.env.SUPABASE_URL`
- ✅ Читает `process.env.NEXT_PUBLIC_SUPABASE_URL`
- ❌ **НЕ читает** `process.env.VITE_SUPABASE_URL`

**Vite проекты (мини-апп):**
- ✅ Читает `import.meta.env.VITE_SUPABASE_URL`
- ❌ НЕ читает `process.env.SUPABASE_URL`

Поэтому нужны **оба формата** переменных!

---

**Добавьте 2 переменные и подождите 3 минуты!** 🚀
