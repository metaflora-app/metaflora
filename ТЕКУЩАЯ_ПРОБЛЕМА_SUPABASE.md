# 🔴 ТЕКУЩАЯ ПРОБЛЕМА: Supabase не фиксирует события

**Дата:** 2026-01-25  
**Статус:** ❌ Интеграция не работает  
**Проект:** Мини-апп Метафлора

---

## 🎯 Что должно работать:

### События в мини-аппе должны фиксироваться в Supabase:

| Действие | Стоимость | Экран | Кнопка/Событие |
|----------|-----------|-------|----------------|
| Регистрация | **0** метакоинов | SplashScreen | Автоматически при первом запуске |
| Подписка 1 мес | **+150** метакоинов | PricingScreen | "оплатить полный доступ" |
| Подписка 3 мес | **+500** метакоинов | PricingScreen | "оплатить полный доступ" |
| Покупка 5000 | **+5000** метакоинов | MetacoinsScreen | "купить метакоины" |
| Покупка 25000 | **+25000** метакоинов | MetacoinsScreen | "купить метакоины" |
| Анализ | **-100** метакоинов | LabaAnalysisScreen | "начать анализ" |
| Сценарий | **-50** метакоинов | LabaAnalysisScreen | "создать сценарий" |
| Поиск | **-25** метакоинов | LabaSearchAccountScreen | "начать отслеживание" |
| Слежка | **-100** метакоинов | LabaSearchAccountScreen | "начать отслеживание" |

---

## ❌ Что НЕ работает:

1. **Регистрация работает** - пользователь создается в Supabase
2. **Остальные события НЕ фиксируются** - транзакции не создаются
3. **Баланс не обновляется** на MainDashboardPremiumScreen
4. **Панель супабейз показывает нули** вместо реальных данных

---

## 🔍 Где искать проблему:

### 1. Проверить Railway логи мини-аппа:
- URL: https://web-production-fc84.up.railway.app
- Логи могут показать ошибки Supabase API

### 2. Проверить Supabase RLS (Row Level Security):
- URL: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/auth/policies
- Возможно, политики блокируют INSERT в `metacoins_transactions`
- Возможно, политики блокируют UPDATE в `users`

### 3. Проверить консоль браузера в мини-аппе:
- Открыть DevTools в мини-аппе
- Проверить Network tab - есть ли запросы к Supabase?
- Проверить Console - есть ли ошибки?

### 4. Проверить Supabase API Keys:
- Anon key правильный?
- URL правильный?

---

## 📁 Файлы для проверки:

### Мини-апп (lct):
- **Supabase клиент:** `/Users/user/.cursor/worktrees/_________/lct/src/utils/supabase.ts`
- **Экраны с трекингом:**
  - `/Users/user/.cursor/worktrees/_________/lct/src/screens/splash/SplashScreen.tsx`
  - `/Users/user/.cursor/worktrees/_________/lct/src/screens/metacoins/MetacoinsScreen.tsx`
  - `/Users/user/.cursor/worktrees/_________/lct/src/screens/pricing/PricingScreen.tsx`
  - `/Users/user/.cursor/worktrees/_________/lct/src/screens/laba-analysis/LabaAnalysisScreen.tsx`
  - `/Users/user/.cursor/worktrees/_________/lct/src/screens/laba-search-account/LabaSearchAccountScreen.tsx`
  - `/Users/user/.cursor/worktrees/_________/lct/src/screens/main-dashboard-premium/MainDashboardPremiumScreen.tsx`

### Веб-сервис (metaflora-service):
- **Supabase клиент:** `/Users/user/.cursor/worktrees/_________/kra/metaflora-service/lib/supabase.ts`
- **Панель супабейз:** `/Users/user/.cursor/worktrees/_________/kra/metaflora-service/app/dashboard/supabase/page.tsx`

---

## 🔧 Supabase конфигурация:

### Project ID:
```
lwjsbflvsmscfrdkejia
```

### URL:
```
https://lwjsbflvsmscfrdkejia.supabase.co
```

### Anon Key:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anNiZmx2c21zY2ZyZGtlamlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjgzMjEsImV4cCI6MjA4NDYwNDMyMX0.sf_9yMijf066geuGGjv0ylxRxKueaaC2J9u5z6Xa6sI
```

### Service Role Key (секретный):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anNiZmx2c21zY2ZyZGtlamlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAyODMyMSwiZXhwIjoyMDg0NjA0MzIxfQ.zfYvrRAWoeRoOyc-wWTyQPGAzYRHTYPXZwNHL1CRcOY
```

---

## 🗄️ Структура таблиц Supabase:

### Таблица `users`:
```
- id (uuid, primary key)
- telegram_id (bigint, unique)
- username (text, nullable)
- first_name (text, nullable)
- last_name (text, nullable)
- avatar_url (text, nullable)
- subscription_type (text: 'free' | 'premium')
- metacoins_balance (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

### Таблица `metacoins_transactions`:
```
- id (uuid, primary key)
- user_id (uuid, foreign key → users.id)
- amount (integer)
- balance_before (integer)
- balance_after (integer)
- transaction_type (text)
- description (text, nullable)
- created_at (timestamp)
- ip_address (text, nullable)
- user_agent (text, nullable)
```

### Transaction types:
- `purchase` - покупка метакоинов
- `subscription_bonus` - бонус при подписке
- `spend_analysis` - трата на анализ
- `spend_scenario` - трата на сценарий
- `spend_search` - трата на поиск
- `spend_tracking` - трата на слежку

---

## 🚀 Production URLs:

- **Мини-апп:** https://web-production-fc84.up.railway.app
- **Веб-сервис:** https://service-production-f0b1.up.railway.app
- **GitHub мини-апп:** https://github.com/metaflora-app/metaflora
- **GitHub сервис:** https://github.com/metaflora-app/service
- **Supabase Dashboard:** https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia

---

## 🐛 Возможные причины проблемы:

### 1. RLS (Row Level Security) блокирует запросы
**Решение:** Отключить RLS или настроить политики:
```sql
-- Для таблицы users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for anon" ON users
FOR ALL USING (true) WITH CHECK (true);

-- Для таблицы metacoins_transactions
ALTER TABLE metacoins_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for anon" ON metacoins_transactions
FOR ALL USING (true) WITH CHECK (true);
```

### 2. CORS проблемы
**Решение:** Проверить в Supabase Dashboard → Settings → API → CORS
- Добавить домены Railway в whitelist

### 3. Telegram WebApp не инициализирован
**Решение:** Проверить, что `window.Telegram.WebApp` доступен
- Добавить проверки и fallback для тестирования

### 4. Async функции не ждут завершения
**Решение:** Добавить `await` и обработку ошибок

---

## 📝 Что нужно сделать:

1. **Прочитать Railway документацию** про environment variables и debugging
2. **Проверить Railway логи** мини-аппа на ошибки
3. **Проверить Supabase RLS** и отключить или настроить политики
4. **Добавить console.log** в функции трекинга для отладки
5. **Проверить Network tab** в браузере - идут ли запросы к Supabase
6. **Проверить, что Telegram WebApp инициализирован** перед вызовами

---

## 🔗 Полезные ссылки:

- **Railway Docs:** https://docs.railway.app
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Supabase JS Client:** https://supabase.com/docs/reference/javascript/introduction
- **Telegram WebApp:** https://core.telegram.org/bots/webapps

---

## 📋 Для следующего агента:

1. Прочитай этот файл: `/Users/user/.cursor/worktrees/_________/lct/ТЕКУЩАЯ_ПРОБЛЕМА_SUPABASE.md`
2. Прочитай: `/Users/user/.cursor/worktrees/_________/lct/ALL_COMPONENTS.md`
3. Прочитай: `/Users/user/.cursor/worktrees/_________/lct/SUPABASE_INTEGRATION.md`
4. Прочитай: `/Users/user/.cursor/worktrees/_________/kra/metaflora-service/ПОЛНОЕ_ОПИСАНИЕ_ПРОЕКТА.md`
5. Проверь Railway логи и Supabase RLS
6. Исправь проблему с фиксацией событий

**Главное:** Внимательно изучи Railway документацию про environment variables и debugging!
