# Настройка Cron на Railway - 2026-02-01

## ✅ Backend код готов

**Файл**: `app/api/cron/update-tracked-reels/route.ts`
**Коммит**: `ea08aa9`

**Что делает**:
1. ✅ Парсит новые reels для каждого отслеживаемого аккаунта
2. ✅ Добавляет поле `is_new: true` и `marked_new_at`
3. ✅ Списывает 15 метакоинов за каждое новое видео
4. ✅ Убирает плашку "новое" через 24 часа
5. ✅ БЕЗ Telegram уведомлений

---

## 🚀 Настройка на Railway

### Шаг 1: Открыть Railway Dashboard

1. Перейти на https://railway.app
2. Войти в аккаунт
3. Открыть проект `metaflora-service`

### Шаг 2: Настроить Cron Job

**Вариант A: Через Railway Cron**

1. В проекте `metaflora-service` → Settings
2. Найти раздел "Cron Jobs" или "Scheduled Tasks"
3. Добавить новый Cron Job:
   - **Schedule**: `0 5 * * *` (каждый день в 5:00 UTC = 8:00 МСК)
   - **Command**: 
     ```bash
     curl https://service-production-f0b1.up.railway.app/api/cron/update-tracked-reels
     ```

**Вариант B: Через внешний сервис (если Railway не поддерживает cron)**

Использовать https://cron-job.org:
1. Создать аккаунт на cron-job.org
2. Добавить новый Cron Job:
   - **Title**: Metaflora Tracked Reels Update
   - **URL**: `https://service-production-f0b1.up.railway.app/api/cron/update-tracked-reels`
   - **Schedule**: `0 5 * * *` (каждый день в 5:00)
   - **Method**: GET
   - **Notifications**: Отключить

---

## 🧪 Тестирование

### Ручной запуск cron

```bash
curl https://service-production-f0b1.up.railway.app/api/cron/update-tracked-reels
```

**Ожидаемый ответ**:
```json
{
  "success": true,
  "processed": 2,
  "totalNewReels": 5,
  "removedBadges": 3,
  "results": [
    {"username": "test1", "newReels": 3},
    {"username": "test2", "newReels": 2}
  ]
}
```

### Проверка плашки "новое"

1. Добавить аккаунт в отслеживаемые
2. Дождаться следующего дня (или запустить cron вручную)
3. Открыть /laba-tracked
4. Новые reels должны иметь плашку "новое"
5. Через 24 часа плашка исчезает

---

## 📝 Структура БД

### Таблица laba_reels

Добавлены поля:
```sql
ALTER TABLE laba_reels ADD COLUMN is_new BOOLEAN DEFAULT false;
ALTER TABLE laba_reels ADD COLUMN marked_new_at TIMESTAMP;
```

**is_new**: флаг плашки "новое"
**marked_new_at**: время добавления плашки (для удаления через 24 часа)

---

## 💰 Списание метакоинов

### Сценарий 1: Первое добавление аккаунта
- Добавление аккаунта: **100 метакоинов**
- Скрапинг 40 reels: **входит в 100 метакоинов**
- **ИТОГО: 100 метакоинов**

### Сценарий 2: Ежедневное обновление
- Каждое новое видео: **15 метакоинов**
- Пример: 5 новых видео = 75 метакоинов
- **Списывается АВТОМАТИЧЕСКИ** (неважно заходил пользователь или нет)

---

## 🎯 Что происходит каждый день в 5 утра

1. Cron запускается
2. Получает все активные отслеживаемые аккаунты
3. Для каждого аккаунта:
   - Парсит последние 40 reels
   - Фильтрует только новые (после последнего в БД)
   - Сохраняет с `is_new: true` и `marked_new_at`
   - Списывает 15 метакоинов за каждое новое видео
4. Убирает плашку "новое" у reels старше 24 часов

---

## ⚠️ Важно

- Cron работает АВТОМАТИЧЕСКИ
- Не требует входа пользователя в мини-апп
- Списание происходит независимо от активности пользователя
- Если недостаточно метакоинов - отслеживание деактивируется (is_active = false)

---

**Дата**: 2026-02-01
**Backend**: `ea08aa9`
**Endpoint**: https://service-production-f0b1.up.railway.app/api/cron/update-tracked-reels
