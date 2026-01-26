# 🐛 Инструкция по отладке Supabase интеграции

**Дата:** 2026-01-25  
**Статус:** Добавлена отладка в код

---

## 🔧 Что было сделано:

### 1. Добавлены console.log во все функции трекинга:

#### `getOrCreateUser()`:
- 🔵 Вызов функции с Telegram ID
- ✅ Найден существующий пользователь
- 🔵 Создание нового пользователя
- ✅ Новый пользователь создан
- ❌ Ошибки при создании/поиске

#### `trackMetacoinsPurchase()`:
- 🔵 Вызов с суммой покупки
- ✅ Пользователь найден + текущий баланс
- ✅ Баланс обновлен + новый баланс
- ✅ Транзакция создана
- ❌ Ошибки при обновлении/создании

#### `trackMetacoinsSpend()`:
- 🔵 Вызов с типом действия и стоимостью
- ✅ Пользователь найден + текущий баланс
- ❌ Недостаточно средств
- ✅ Баланс обновлен + новый баланс
- ✅ Транзакция создана
- ❌ Ошибки при обновлении/создании

#### `trackSubscriptionPurchase()`:
- 🔵 Вызов с типом подписки и количеством месяцев
- ✅ Пользователь найден + текущий баланс
- 💰 Бонусные метакоины + новый баланс
- ✅ Подписка обновлена
- ✅ Бонусная транзакция создана
- ❌ Ошибки при обновлении/создании

---

## 📋 Как проверить:

### Шаг 1: Открыть мини-апп в браузере

1. Открыть https://web-production-fc84.up.railway.app
2. Открыть DevTools (F12 или Cmd+Option+I)
3. Перейти на вкладку **Console**

### Шаг 2: Выполнить действия в мини-аппе

#### Тест 1: Регистрация
1. Обновить страницу (Cmd+R или F5)
2. Дождаться загрузки SplashScreen
3. **Ожидаемые логи:**
   ```
   🔵 getOrCreateUser called for Telegram ID: 123456789
   ✅ New user created: uuid-here
   ```

#### Тест 2: Покупка метакоинов
1. Перейти на экран MetacoinsScreen
2. Выбрать карточку 5000 или 25000
3. Нажать "купить метакоины"
4. **Ожидаемые логи:**
   ```
   🔵 trackMetacoinsPurchase called with amount: 5000
   🔵 getOrCreateUser called for Telegram ID: 123456789
   ✅ Existing user found: uuid-here
   ✅ User found: uuid-here Current balance: 0
   ✅ Balance updated successfully. New balance: 5000
   ✅ Transaction created successfully
   ```

#### Тест 3: Покупка подписки
1. Перейти на экран PricingScreen
2. Выбрать 1 месяц или 3 месяца
3. Нажать "оплатить полный доступ"
4. **Ожидаемые логи:**
   ```
   🔵 trackSubscriptionPurchase called: premium months: 1
   🔵 getOrCreateUser called for Telegram ID: 123456789
   ✅ Existing user found: uuid-here
   ✅ User found: uuid-here Current balance: 5000
   💰 Bonus metacoins: 150 New balance: 5150
   ✅ Subscription updated successfully
   ✅ Bonus transaction created successfully
   ```

#### Тест 4: Анализ контента
1. Перейти на экран LabaAnalysisScreen
2. Нажать "начать анализ"
3. **Ожидаемые логи:**
   ```
   🔵 trackMetacoinsSpend called: analysis cost: 100
   🔵 getOrCreateUser called for Telegram ID: 123456789
   ✅ Existing user found: uuid-here
   ✅ User found: uuid-here Current balance: 5150
   ✅ Balance updated successfully. New balance: 5050
   ✅ Transaction created successfully
   ```

#### Тест 5: Создание сценария
1. На экране LabaAnalysisScreen после анализа
2. Нажать "создать сценарий"
3. **Ожидаемые логи:**
   ```
   🔵 trackMetacoinsSpend called: scenario cost: 50
   🔵 getOrCreateUser called for Telegram ID: 123456789
   ✅ Existing user found: uuid-here
   ✅ User found: uuid-here Current balance: 5050
   ✅ Balance updated successfully. New balance: 5000
   ✅ Transaction created successfully
   ```

#### Тест 6: Поиск и слежка
1. Перейти на экран LabaSearchAccountScreen
2. Нажать "начать отслеживание"
3. **Ожидаемые логи:**
   ```
   🔵 trackMetacoinsSpend called: search cost: 25
   🔵 getOrCreateUser called for Telegram ID: 123456789
   ✅ Existing user found: uuid-here
   ✅ User found: uuid-here Current balance: 5000
   ✅ Balance updated successfully. New balance: 4975
   ✅ Transaction created successfully
   🔵 trackMetacoinsSpend called: tracking cost: 100
   🔵 getOrCreateUser called for Telegram ID: 123456789
   ✅ Existing user found: uuid-here
   ✅ User found: uuid-here Current balance: 4975
   ✅ Balance updated successfully. New balance: 4875
   ✅ Transaction created successfully
   ```

---

## 🔍 Возможные ошибки и их решения:

### Ошибка 1: "No Telegram user ID"
**Причина:** Telegram WebApp не инициализирован  
**Решение:** 
- Проверить, что мини-апп открыт через Telegram
- Добавить fallback для тестирования в браузере

### Ошибка 2: "Error fetching user" или "Error creating user"
**Причина:** Проблемы с Supabase RLS или API  
**Решение:**
1. Проверить Supabase RLS политики:
   - https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/auth/policies
2. Отключить RLS или добавить политику:
   ```sql
   CREATE POLICY "Enable all for anon" ON users
   FOR ALL USING (true) WITH CHECK (true);
   ```

### Ошибка 3: "Error updating balance" или "Error creating transaction"
**Причина:** Проблемы с Supabase RLS или API  
**Решение:**
1. Проверить Supabase RLS политики для `metacoins_transactions`
2. Отключить RLS или добавить политику:
   ```sql
   CREATE POLICY "Enable all for anon" ON metacoins_transactions
   FOR ALL USING (true) WITH CHECK (true);
   ```

### Ошибка 4: "Insufficient balance"
**Причина:** Недостаточно метакоинов на балансе  
**Решение:**
- Купить метакоины или подписку сначала
- Проверить текущий баланс в логах

### Ошибка 5: CORS ошибки
**Причина:** Railway домен не добавлен в Supabase whitelist  
**Решение:**
1. Открыть Supabase Dashboard → Settings → API → CORS
2. Добавить домены:
   - https://web-production-fc84.up.railway.app
   - http://localhost:5173

---

## 📊 Проверка в Supabase Dashboard:

### 1. Проверить таблицу `users`:
- URL: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/editor/28433
- Должны видеть нового пользователя с `telegram_id`
- Баланс должен обновляться после покупок/трат

### 2. Проверить таблицу `metacoins_transactions`:
- URL: https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/editor/28434
- Должны видеть все транзакции с правильными типами:
  - `purchase` - покупка метакоинов
  - `subscription_bonus` - бонус при подписке
  - `spend_analysis` - трата на анализ
  - `spend_scenario` - трата на сценарий
  - `spend_search` - трата на поиск
  - `spend_tracking` - трата на слежку

---

## 🚀 Следующие шаги:

1. **Запустить мини-апп** в браузере
2. **Открыть DevTools Console**
3. **Выполнить все тесты** из списка выше
4. **Скопировать логи** из консоли
5. **Проверить Supabase Dashboard** - есть ли данные в таблицах?
6. **Если ошибки** - скопировать текст ошибок и показать агенту

---

## 📝 Коммит:

```bash
git add .
git commit -m "debug: add console.log to all Supabase tracking functions"
git push origin main
```

---

**Готово!** Теперь можно запустить мини-апп и посмотреть логи в консоли.
