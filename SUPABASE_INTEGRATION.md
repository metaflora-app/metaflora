# 🔗 Supabase Integration - Полная документация

**Дата:** 2026-01-24  
**Статус:** ✅ Интеграция завершена

---

## 📊 Архитектура:

```
Мини-апп (Railway)
    ↓ События пользователя
Supabase (База данных)
    ↓ Real-time обновления
Веб-сервис (Railway) - Панель супабейз
```

---

## 🗄️ Структура таблиц Supabase:

### Таблица `users`:
```sql
- id (uuid, primary key)
- telegram_id (bigint, unique) - ID пользователя Telegram
- username (text, nullable) - username из Telegram
- first_name (text, nullable)
- last_name (text, nullable)
- avatar_url (text, nullable)
- subscription_type (text) - 'free' | 'premium'
- metacoins_balance (integer) - текущий баланс метакоинов
- created_at (timestamp)
- updated_at (timestamp)
```

### Таблица `metacoins_transactions`:
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key → users.id)
- amount (integer) - количество метакоинов (+/-)
- balance_before (integer) - баланс до транзакции
- balance_after (integer) - баланс после транзакции
- transaction_type (text) - тип транзакции:
  * 'initial' - начальное начисление (150)
  * 'purchase' - покупка метакоинов
  * 'subscription_bonus' - бонус при покупке подписки
  * 'spend_analysis' - трата на анализ
  * 'spend_search' - трата на поиск
  * 'spend_scenario' - трата на сценарий
  * 'spend_tracking' - трата на слежку
- description (text, nullable) - описание транзакции
- created_at (timestamp)
- ip_address (text, nullable)
- user_agent (text, nullable)
```

---

## 🎯 События, которые фиксируются:

### 1. Регистрация пользователя (SplashScreen)
- **Когда:** При первом запуске мини-аппа
- **Действие:** Создание пользователя в `users`
- **Бонус:** +150 метакоинов
- **Транзакция:** `initial` в `metacoins_transactions`
- **Функция:** `getOrCreateUser()`

### 2. Покупка метакоинов (MetacoinsScreen)
- **Когда:** Клик на "купить метакоины"
- **Варианты:** 5000 или 25000 метакоинов
- **Действие:** Обновление баланса в `users`
- **Транзакция:** `purchase` в `metacoins_transactions`
- **Функция:** `trackMetacoinsPurchase(amount)`

### 3. Покупка подписки (PricingScreen)
- **Когда:** Клик на "оплатить полный доступ"
- **Варианты:** 1 месяц (+150 метакоинов) или 3 месяца (+500 метакоинов)
- **Действие:** 
  - Обновление `subscription_type` в `users`
  - Начисление бонусных метакоинов
- **Транзакция:** `subscription_bonus` в `metacoins_transactions`
- **Функция:** `trackSubscriptionPurchase('premium', months)`

### 4. Анализ контента (LabaAnalysisScreen)
- **Когда:** Клик на "начать анализ"
- **Стоимость:** -10 метакоинов
- **Действие:** Списание с баланса
- **Транзакция:** `spend_analysis` в `metacoins_transactions`
- **Функция:** `trackMetacoinsSpend('analysis', 10)`

### 5. Создание сценария (LabaAnalysisScreen)
- **Когда:** Клик на "создать сценарий"
- **Стоимость:** -15 метакоинов
- **Действие:** Списание с баланса
- **Транзакция:** `spend_scenario` в `metacoins_transactions`
- **Функция:** `trackMetacoinsSpend('scenario', 15)`

### 6. Поиск аккаунта (LabaSearchAccountScreen)
- **Когда:** Клик на "начать отслеживание"
- **Стоимость:** -5 метакоинов
- **Действие:** Списание с баланса
- **Транзакция:** `spend_search` в `metacoins_transactions`
- **Функция:** `trackMetacoinsSpend('search', 5)`

### 7. Отслеживание аккаунта (LabaTrackedScreen)
- **Когда:** Загрузка экрана с отслеживаемыми аккаунтами
- **Стоимость:** -20 метакоинов (за каждый просмотр)
- **Действие:** Списание с баланса
- **Транзакция:** `spend_tracking` в `metacoins_transactions`
- **Функция:** `trackMetacoinsSpend('tracking', 20)`

---

## 📈 Панель супабейз (metaflora-service):

### Карточка "Пользователи":
- **всего** - COUNT(*) from users
- **новых за сегодня** - COUNT(*) WHERE created_at >= today
- **новых за неделю** - COUNT(*) WHERE created_at >= week_ago
- **с подпиской** - COUNT(*) WHERE subscription_type = 'premium'

### Карточка "Метакоины":
- **куплено** - SUM(amount) WHERE type IN ('purchase', 'subscription_bonus', 'initial')
- **куплено за сегодня** - SUM(amount) WHERE type IN ('purchase', 'subscription_bonus') AND created_at >= today
- **потрачено за сегодня** - SUM(ABS(amount)) WHERE type LIKE 'spend_%' AND created_at >= today
- **анализов за сегодня** - COUNT(*) WHERE type = 'spend_analysis' AND created_at >= today
- **поисков за сегодня** - COUNT(*) WHERE type = 'spend_search' AND created_at >= today
- **сценариев за сегодня** - COUNT(*) WHERE type = 'spend_scenario' AND created_at >= today
- **слежек за сегодня** - COUNT(*) WHERE type = 'spend_tracking' AND created_at >= today

### Обновление данных:
- **Автоматическое обновление** каждые 30 секунд
- **Кнопки "открыть"** ведут на соответствующие таблицы в Supabase Dashboard

---

## 🔧 Технические детали:

### Мини-апп (lct):
- **Файл:** `src/utils/supabase.ts`
- **Функции:**
  - `getOrCreateUser()` - получить или создать пользователя
  - `trackMetacoinsPurchase(amount)` - покупка метакоинов
  - `trackMetacoinsSpend(actionType, cost)` - трата метакоинов
  - `trackSubscriptionPurchase(type, months)` - покупка подписки

### Веб-сервис (metaflora-service):
- **Файл:** `lib/supabase.ts`
- **Функция:** `getDashboardStats()` - получение всей статистики
- **Компонент:** `app/dashboard/supabase/page.tsx`
- **Обновление:** useEffect с интервалом 30 секунд

---

## 🚀 Конфигурация Supabase:

### URL:
```
https://lwjsbflvsmscfrdkejia.supabase.co
```

### Anon Key:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anNiZmx2c21zY2ZyZGtlamlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjgzMjEsImV4cCI6MjA4NDYwNDMyMX0.sf_9yMijf066geuGGjv0ylxRxKueaaC2J9u5z6Xa6sI
```

### Прямые ссылки на таблицы:
- **users:** https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/editor/28433
- **metacoins_transactions:** https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/editor/28434

---

## 📦 Зависимости:

### Мини-апп:
```json
"@supabase/supabase-js": "^2.91.1"
```

### Веб-сервис:
```json
"@supabase/supabase-js": "^2.91.1"
```

---

## ✅ Что работает:

1. ✅ Автоматическая регистрация пользователя при первом запуске
2. ✅ Начисление 150 метакоинов новым пользователям
3. ✅ Трекинг покупки метакоинов
4. ✅ Трекинг покупки подписки с бонусами
5. ✅ Трекинг всех действий (анализ, поиск, сценарий, слежка)
6. ✅ Real-time отображение статистики на панели супабейз
7. ✅ Автообновление данных каждые 30 секунд
8. ✅ Прямые ссылки на таблицы Supabase

---

## 🧪 Тестирование:

### Шаг 1: Запустить мини-апп
```bash
cd /Users/user/.cursor/worktrees/_________/lct
npm run dev
```

### Шаг 2: Запустить веб-сервис
```bash
cd /Users/user/.cursor/worktrees/_________/kra/metaflora-service
PORT=3001 npm run dev
```

### Шаг 3: Открыть панель супабейз
- URL: http://localhost:3001/dashboard/supabase
- Пароль: metaflora2026

### Шаг 4: Выполнить действия в мини-аппе:
1. Открыть мини-апп (автоматическая регистрация)
2. Купить метакоины
3. Купить подписку
4. Сделать анализ
5. Создать сценарий
6. Найти аккаунт
7. Открыть отслеживаемые

### Шаг 5: Проверить панель супабейз:
- Данные должны обновиться в течение 30 секунд
- Или обновить страницу вручную

---

## 🌐 Production URLs:

### Мини-апп:
- https://web-production-fc84.up.railway.app

### Веб-сервис:
- https://service-production-f0b1.up.railway.app
- https://metaflora-service.ru (DNS обновляется)

### Supabase Dashboard:
- https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia

---

## 🔒 Безопасность:

### Row Level Security (RLS):
⚠️ **Важно:** Убедись, что RLS включен для таблиц `users` и `metacoins_transactions`!

### Политики доступа:
```sql
-- Пользователи могут читать только свои данные
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint);

-- Пользователи могут читать только свои транзакции
CREATE POLICY "Users can view own transactions"
ON metacoins_transactions FOR SELECT
USING (user_id IN (SELECT id FROM users WHERE telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint));

-- Сервис может читать все (через service_role key)
```

---

## 📝 Стоимость действий:

| Действие | Стоимость (метакоины) |
|----------|----------------------|
| Регистрация | +150 (бонус) |
| Подписка 1 мес | +150 (бонус) |
| Подписка 3 мес | +500 (бонус) |
| Анализ контента | -10 |
| Создание сценария | -15 |
| Поиск аккаунта | -5 |
| Отслеживание | -20 |

---

## 🐛 Troubleshooting:

### Проблема: Данные не обновляются на панели
**Решение:**
1. Проверь, что Supabase URL и ключи правильные
2. Проверь RLS политики в Supabase
3. Открой консоль браузера и проверь ошибки
4. Проверь Network tab - должны быть запросы к Supabase

### Проблема: "supabaseUrl is required"
**Решение:**
- Убедись, что в `lib/supabase.ts` есть fallback credentials
- Или добавь переменные окружения в Railway:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://lwjsbflvsmscfrdkejia.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  ```

### Проблема: Node.js version error
**Решение:**
- Убедись, что `nixpacks.toml` содержит `nodejs_20`
- Railway автоматически использует Node.js 20

---

## 📚 Полезные ссылки:

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Railway Docs](https://docs.railway.app)
- [Next.js Docs](https://nextjs.org/docs)

---

**Готово!** Мини-апп и веб-сервис полностью интегрированы через Supabase.
