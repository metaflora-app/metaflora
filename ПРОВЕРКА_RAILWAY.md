# 🚂 Проверка Railway конфигурации

**Дата:** 2026-01-25  
**Цель:** Проверить, что все environment variables настроены правильно

---

## 📋 Что нужно проверить в Railway:

### 1. Открыть Railway Dashboard:
- URL: https://railway.app/project/YOUR_PROJECT_ID
- Найти проект "metaflora" (мини-апп)
- Открыть вкладку **Variables**

### 2. Проверить наличие переменных окружения:

#### Обязательные переменные (если используются):
```bash
# Supabase (если используются в коде)
VITE_SUPABASE_URL=https://lwjsbflvsmscfrdkejia.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Telegram (если используются)
VITE_TELEGRAM_BOT_TOKEN=...
```

### 3. Проверить логи Railway:

#### Открыть логи:
1. Railway Dashboard → Deployments
2. Выбрать последний деплой
3. Открыть вкладку **Logs**

#### Искать ошибки:
- ❌ "supabaseUrl is required"
- ❌ "No Telegram user ID"
- ❌ "Error fetching user"
- ❌ "Error creating user"
- ❌ "Error updating balance"
- ❌ "Error creating transaction"
- ❌ CORS errors

---

## 🔍 Важно:

### В нашем коде Supabase credentials HARDCODED:

Файл: `src/utils/supabase.ts`

```typescript
const supabaseUrl = 'https://lwjsbflvsmscfrdkejia.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Это означает:**
- ✅ Environment variables НЕ нужны для Supabase
- ✅ Код будет работать на Railway без дополнительной настройки
- ⚠️ НО: это небезопасно для production (ключи видны в коде)

---

## 🐛 Если в Railway логах есть ошибки:

### Ошибка: "Failed to fetch" или "Network error"
**Причина:** CORS или Supabase недоступен  
**Решение:**
1. Проверить Supabase Dashboard → Settings → API → CORS
2. Добавить Railway домен в whitelist

### Ошибка: "Row Level Security policy violation"
**Причина:** RLS блокирует запросы  
**Решение:**
1. Открыть Supabase Dashboard → Authentication → Policies
2. Отключить RLS или добавить политику для anon

### Ошибка: "Invalid API key"
**Причина:** Неправильный Anon Key  
**Решение:**
1. Открыть Supabase Dashboard → Settings → API
2. Скопировать правильный Anon Key
3. Обновить в `src/utils/supabase.ts`

---

## 📊 Проверка Supabase RLS:

### 1. Открыть Supabase Dashboard:
- URL: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia

### 2. Проверить RLS для таблицы `users`:
- Authentication → Policies → users
- **Если RLS включен** - проверить политики
- **Если политик нет** - добавить или отключить RLS

### 3. Проверить RLS для таблицы `metacoins_transactions`:
- Authentication → Policies → metacoins_transactions
- **Если RLS включен** - проверить политики
- **Если политик нет** - добавить или отключить RLS

---

## 🔧 SQL для отключения RLS (если нужно):

```sql
-- Отключить RLS для таблицы users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Отключить RLS для таблицы metacoins_transactions
ALTER TABLE metacoins_transactions DISABLE ROW LEVEL SECURITY;
```

**⚠️ ВНИМАНИЕ:** Это небезопасно для production! Используйте только для отладки.

---

## 🔧 SQL для добавления политик (безопасный вариант):

```sql
-- Политика для таблицы users (разрешить всё для anon)
CREATE POLICY "Enable all for anon" ON users
FOR ALL USING (true) WITH CHECK (true);

-- Политика для таблицы metacoins_transactions (разрешить всё для anon)
CREATE POLICY "Enable all for anon" ON metacoins_transactions
FOR ALL USING (true) WITH CHECK (true);
```

---

## 📝 Чек-лист проверки:

- [ ] Railway логи не содержат ошибок Supabase
- [ ] Supabase RLS отключен или настроен
- [ ] CORS настроен в Supabase (Railway домен добавлен)
- [ ] Telegram WebApp инициализируется (если используется)
- [ ] Console.log показывает правильные логи в браузере

---

**Готово!** Теперь можно проверить Railway и Supabase конфигурацию.
