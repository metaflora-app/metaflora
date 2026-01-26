# Metaflora API Proxy

Простой API proxy для обхода ограничений Telegram WebApp на прямые запросы к Supabase.

## Деплой на Railway

1. Создай новый проект на Railway
2. Подключи этот репозиторий
3. Укажи Root Directory: `api-proxy`
4. Railway автоматически определит Node.js и запустит `npm start`
5. После деплоя скопируй URL (например: `https://api-proxy-production-xxxx.up.railway.app`)
6. Добавь переменную окружения в мини-апп проект:
   - `VITE_API_PROXY_URL=https://api-proxy-production-xxxx.up.railway.app`

## Endpoints

- `GET /api/user?telegram_id=123` - получить пользователя
- `PATCH /api/user/:id/balance` - обновить баланс
  ```json
  { "balance": 9900 }
  ```
- `POST /api/transaction` - создать транзакцию
  ```json
  {
    "user_id": "uuid",
    "amount": -100,
    "balance_before": 10000,
    "balance_after": 9900,
    "transaction_type": "spend",
    "description": "Использование: analysis"
  }
  ```

## Локальный запуск

```bash
cd api-proxy
npm install
npm start
```

Сервер запустится на http://localhost:3000
