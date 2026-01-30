# ✅ ИСПРАВЛЕНИЕ ПРИМЕНЕНО

**Дата:** 2026-01-30  
**Проблема:** API URL был неправильный в мини-аппе  
**Решение:** Обновлен `src/utils/labaApi.ts`

---

## ЧТО ИСПРАВЛЕНО

### Файл: `src/utils/labaApi.ts`

**Было:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://metaflora-service.ru';
```

**Стало:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://service-production-f0b1.up.railway.app';
```

---

## СЛЕДУЮЩИЕ ШАГИ

### ⚠️ КРИТИЧНО: Настроить переменные окружения на Railway

API endpoints работают, но возвращают ошибки потому что **не настроены environment variables**.

**Прочитать обязательно:** `LABA_TROUBLESHOOTING.md`

### Краткая инструкция:

1. **Зайти в Railway Dashboard:**
   - https://railway.app/dashboard
   - Выбрать проект metaflora-service

2. **Добавить Variables:**
   ```
   VITE_SUPABASE_URL=https://lwjsbflvsmscfrdkejia.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJh... (ваш ключ)
   APIFY_API_TOKEN=apify_api_... (ваш токен)
   OPENAI_API_KEY=sk-proj-... (ваш ключ)
   OPENROUTER_API_KEY=sk-or-v1-... (ваш ключ)
   ```

3. **Где взять API ключи:**
   - Apify: https://console.apify.com/account/integrations
   - OpenAI: https://platform.openai.com/api-keys
   - OpenRouter: https://openrouter.ai/settings/keys

4. **Пополнить балансы:**
   - OpenAI: $5-10 → https://platform.openai.com/settings/billing
   - OpenRouter: $5-10 → https://openrouter.ai/settings/billing

5. **Подождать перезапуска (2-3 минуты)**

6. **Проверить:**
   ```bash
   curl "https://service-production-f0b1.up.railway.app/api/laba/top-reels?category=нейросети"
   ```

7. **Задеплоить мини-апп:**
   ```bash
   cd /Users/user/.cursor/worktrees/_________/fxp
   git add -A
   git commit -m "fix(laba): use correct Railway API URL"
   git push origin HEAD:main
   ```

---

## ПРОВЕРКА РАБОТЫ

После настройки переменных и деплоя:

1. Откройте мини-апп: https://web-production-fc84.up.railway.app
2. Проверьте что загружаются reels
3. Попробуйте поиск
4. Попробуйте анализ

---

## СТАТУС API ENDPOINTS

**Проверено 2026-01-30:**

| Endpoint | Статус | Проблема |
|----------|--------|----------|
| GET /api/laba/top-reels | ✅ Работает | Пустой массив (норм) |
| POST /api/laba/search-reels | ❌ Ошибка | Нет APIFY_API_TOKEN |
| POST /api/laba/search-account | ❌ Ошибка | Нет APIFY_API_TOKEN |
| POST /api/laba/analyze-reel | ? Не проверен | Нужны OPENAI + OPENROUTER |
| POST /api/laba/generate-scenario | ? Не проверен | Нужен OPENROUTER |

---

## БАЛАНС ПОЛЬЗОВАТЕЛЯ

**Telegram ID:** 994500304  
**Метакоины:** 22,000 ✅ Достаточно для тестирования

**Проверить в Supabase:**
```sql
SELECT metacoins_balance 
FROM users 
WHERE telegram_id = 994500304;
```

---

**После настройки переменных все заработает! 🚀**
