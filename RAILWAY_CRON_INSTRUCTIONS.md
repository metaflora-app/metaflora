# Railway Cron Setup Instructions

## Проблема
В Railway нет возможности вставить прямую ссылку в команду cron. Нужно использовать переменные окружения.

## Решение

### Шаг 1: Добавить переменную окружения

1. Открыть Railway Dashboard → metaflora-service → Variables
2. Добавить новую переменную:
   - **Variable Name:** `CRON_ENDPOINT_URL`
   - **Value:** `https://service-production-f0b1.up.railway.app/api/cron/update-tracked-reels`

### Шаг 2: Настроить Cron Schedule

1. Railway Dashboard → metaflora-service → Settings → Cron Jobs
2. Добавить новый Cron Job:
   - **Schedule:** `0 5 * * *` (каждый день в 5:00 UTC = 8:00 МСК)
   - **Command:** `curl $CRON_ENDPOINT_URL`

### Шаг 3: Проверить работу

Ручной запуск для проверки:
```bash
curl https://service-production-f0b1.up.railway.app/api/cron/update-tracked-reels
```

Ожидаемый ответ:
```json
{
  "success": true,
  "processed": 2,
  "totalNewReels": 5,
  "removedBadges": 3,
  "results": [...]
}
```

## Что делает cron

1. ✅ Получает все активные отслеживаемые аккаунты
2. ✅ Для каждого аккаунта парсит последние 40 reels
3. ✅ Фильтрует только НОВЫЕ reels (после последнего в БД)
4. ✅ Сохраняет новые reels с плашкой "новое" (is_new: true)
5. ✅ Списывает 15 метакоинов за каждое новое видео
6. ✅ Убирает плашку "новое" у reels старше 24 часов
7. ✅ БЕЗ Telegram уведомлений

## Важно

- Cron НЕ перезагружает все reels, а добавляет только новые
- Если недостаточно метакоинов - отслеживание деактивируется
- Плашка "новое" исчезает автоматически через 24 часа
