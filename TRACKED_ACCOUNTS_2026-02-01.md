# Отслеживание аккаунтов - 2026-02-01

## ✅ ВСЕ ЗАДАЧИ ВЫПОЛНЕНЫ

### 1. ✅ Кнопки "анализ" в LabaMainScreen
**Файл**: `src/components/ReelCard.tsx`

**Что сделано**:
- Поднят z-index с 10 до 9999
- Кнопка теперь поверх всех элементов
- Без свечения (нет класса `button-inner-glow`)

### 2. ✅ LabaTrackedScreen - полная переработка
**Файл**: `src/screens/laba-tracked/LabaTrackedScreen.tsx`

**Что сделано**:
- ❌ Удалены 4 хардкод карточки (1370 строк кода)
- ✅ Добавлены динамические `ReelCard` и `BlurReelCard`
- ✅ Горизонтальный скролл с отслеживаемыми аккаунтами
- ✅ Кнопка "+" всегда справа от последнего аккаунта
- ✅ Кнопка "удалить" с веб-апп попапом
- ✅ Отображение данных: аватар, ник, подписчики, лого инста
- ✅ Выделение выбранного аккаунта (светлее фон)

### 3. ✅ Backend: Парсинг при добавлении аккаунта
**Файл**: `app/api/laba/track-account/route.ts`

**Что сделано**:
- Парсинг **40 reels** (было 20)
- Списание **15 метакоинов за каждое видео**
- Веб-апп попап: "reels аккаунта @username успешно найдены"
- Сохранение в `laba_reels` с `tracked_account_id`

### 4. ✅ Backend: Ежедневный cron
**Файл**: `app/api/cron/update-tracked-reels/route.ts` (НОВЫЙ)

**Что сделано**:
- Парсинг новых reels для всех отслеживаемых аккаунтов
- Проверка баланса перед парсингом (минимум 15 метакоинов)
- Списание 15 метакоинов за каждое новое видео
- Отправка в Telegram бота:
  - Текст: "👋 новые видео аккаунта @username"
  - Вложения: до 10 видео
  - Если больше 10: "...и еще N видео доступны в мини-приложении"
- Деактивация аккаунта если недостаточно метакоинов

### 5. ✅ Frontend: Обработка попапов
**Файлы**: 
- `src/screens/laba-search-account/LabaSearchAccountScreen.tsx`
- `src/utils/labaApi.ts`
- `src/types/laba.ts`

**Что сделано**:
- Обработка `showPopup` и `popupMessage` из API
- Два попапа: результат парсинга + информация о стоимости
- Обновлены типы `TrackAccountResponse`

---

## 📊 Коммиты

### Frontend
**Коммит**: `6e6aa7b`
**Файлов**: 5
- `src/components/ReelCard.tsx` - z-index 9999 для кнопки анализ
- `src/screens/laba-tracked/LabaTrackedScreen.tsx` - горизонтальный скролл + динамические карточки
- `src/screens/laba-search-account/LabaSearchAccountScreen.tsx` - обработка попапов
- `src/utils/labaApi.ts` - обновлен trackAccount
- `src/types/laba.ts` - обновлен TrackAccountResponse

### Backend
**Коммит 1**: `c4f1f48` - основной функционал
**Коммит 2**: `22bc447` - исправление импорта

**Файлов**: 2
- `app/api/laba/track-account/route.ts` - парсинг 40 reels + списание метакоинов
- `app/api/cron/update-tracked-reels/route.ts` - ежедневный cron (НОВЫЙ)

---

## 🎯 Как работает система отслеживания

### Добавление аккаунта

1. Пользователь ищет аккаунт в LabaSearchAccountScreen
2. Нажимает "добавить в отслеживаемые"
3. Backend:
   - Списывает 150 метакоинов за отслеживание
   - Парсит 40 последних reels
   - Списывает 15 метакоинов за каждое видео
   - Сохраняет в `laba_tracked_accounts` и `laba_reels`
4. Frontend показывает попап: "reels аккаунта @username успешно найдены"
5. Переход на LabaTrackedScreen

### Ежедневное обновление

1. Cron запускается каждый день: `/api/cron/update-tracked-reels`
2. Для каждого отслеживаемого аккаунта:
   - Проверяет баланс (минимум 15 метакоинов)
   - Парсит новые reels за последние 24 часа
   - Списывает 15 метакоинов за каждое новое видео
   - Отправляет в Telegram:
     - Текст с количеством видео
     - Вложения: до 10 видео
     - Если больше 10: дополнительное сообщение
3. Если баланс недостаточен:
   - Деактивирует отслеживание (`is_active = false`)
   - Отправляет уведомление в Telegram

### LabaTrackedScreen

1. Горизонтальный скролл с аккаунтами вверху
2. Каждый аккаунт показывает:
   - Аватар
   - @username
   - Количество подписчиков
   - Лого Instagram
   - Кнопка "удалить"
3. Кнопка "+" всегда справа
4. Клик на аккаунт → показывает его reels
5. Reels отображаются через `ReelCard` (как в LabaMainScreen)

---

## 💰 Стоимость

- **Добавление аккаунта**: 150 метакоинов
- **Каждое видео при добавлении**: 15 метакоинов
- **Каждое новое видео (ежедневно)**: 15 метакоинов

**Пример**:
- Добавили аккаунт с 40 видео: 150 + (40 × 15) = **750 метакоинов**
- Каждый день 5 новых видео: 5 × 15 = **75 метакоинов/день**

---

## 📱 Telegram уведомления

### Формат сообщения

**1 видео**:
```
👋 новые видео аккаунта @username

новое видео
```
+ 1 видео вложением

**2-10 видео**:
```
👋 новые видео аккаунта @username

найдено 5 новых видео
```
+ 5 видео вложениями

**Больше 10 видео**:
```
👋 новые видео аккаунта @username

найдено 15 новых видео (показываем первые 10)
```
+ 10 видео вложениями
```
...и еще 5 видео доступны в мини-приложении
```

### Недостаточно метакоинов:
```
⚠️ Отслеживание аккаунта @username остановлено: недостаточно метакоинов (баланс: 45)
```

---

## 🔧 API Endpoints

### POST /api/laba/track-account
Добавить аккаунт в отслеживаемые

**Request**:
```json
{
  "username": "mishchenko.is",
  "userId": 123456
}
```

**Response**:
```json
{
  "success": true,
  "accountId": "uuid",
  "reelsAdded": 40,
  "showPopup": true,
  "popupMessage": "reels аккаунта @mishchenko.is успешно найдены"
}
```

### GET /api/laba/tracked-reels
Получить reels отслеживаемого аккаунта

**Request**:
```
GET /api/laba/tracked-reels?accountId=uuid&userId=123456
```

**Response**:
```json
{
  "success": true,
  "reels": [...]
}
```

### GET /api/cron/update-tracked-reels
Ежедневное обновление (запускается автоматически)

**Response**:
```json
{
  "success": true,
  "processed": 5,
  "totalNewReels": 23,
  "results": [
    { "username": "mishchenko.is", "newReels": 5 },
    { "username": "another", "newReels": 18 }
  ]
}
```

---

## 📁 Ключевые файлы

### Frontend
- `src/screens/laba-tracked/LabaTrackedScreen.tsx` - экран отслеживания
- `src/screens/laba-search-account/LabaSearchAccountScreen.tsx` - поиск и добавление
- `src/components/ReelCard.tsx` - карточка reel (z-index 9999)
- `src/components/BlurReelCard.tsx` - placeholder карточка
- `src/utils/labaApi.ts` - API функции
- `src/types/laba.ts` - типы

### Backend
- `app/api/laba/track-account/route.ts` - добавление аккаунта
- `app/api/laba/tracked-reels/route.ts` - получение reels
- `app/api/cron/update-tracked-reels/route.ts` - ежедневный cron
- `lib/apify.ts` - парсинг Instagram
- `lib/labaHelpers.ts` - метакоины и лимиты

---

## 🚀 Деплой

**Frontend**: `6e6aa7b` → https://web-production-fc84.up.railway.app
**Backend**: `22bc447` → https://service-production-f0b1.up.railway.app

---

## 🧪 Как протестировать

### 1. Добавление аккаунта
1. Открой `/laba-search-account`
2. Введи username (например: `mishchenko.is`)
3. Нажми "искать"
4. Нажми "добавить в отслеживаемые"
5. Подтверди в попапе
6. Должен появиться попап: "reels аккаунта @mishchenko.is успешно найдены"
7. Переход на `/laba-tracked`

### 2. Просмотр отслеживаемых
1. Открой `/laba-tracked`
2. Вверху горизонтальный скролл с аккаунтами
3. Клик на аккаунт → показываются его reels
4. Кнопка "+" справа → переход на добавление

### 3. Удаление аккаунта
1. В LabaTrackedScreen
2. Клик на кнопку "удалить" на карточке аккаунта
3. Попап: "аккаунт удален из отслеживаемых"
4. Аккаунт исчезает из списка

### 4. Кнопки анализ
1. Открой `/laba-main`
2. На каждой карточке внизу кнопка "анализ"
3. Клик → переход на `/laba-analysis`

### 5. Ежедневный cron (тест вручную)
```bash
curl https://service-production-f0b1.up.railway.app/api/cron/update-tracked-reels
```

---

## ⚠️ Важно

### TELEGRAM_BOT_TOKEN
Нужно добавить в переменные окружения Railway:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

Без этого токена уведомления в Telegram не будут работать.

### Настройка cron на Railway
Добавить в Railway:
```
Cron: 0 12 * * *
Command: curl https://service-production-f0b1.up.railway.app/api/cron/update-tracked-reels
```

---

**Дата**: 2026-02-01 09:45
**Frontend**: `6e6aa7b`
**Backend**: `22bc447`
**Статус**: ✅ Готово к тестированию
