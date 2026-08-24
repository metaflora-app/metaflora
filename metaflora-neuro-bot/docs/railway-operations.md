# Railway: эксплуатация МЕТАФЛОРА* нейро

## Состав проекта

Бот разворачивается в отдельном Railway-проекте и отдельном сервисе. Внутри сервиса работает один процесс long polling. Число реплик зафиксировано в `railway.json`, а контейнер дополнительно держит файловую блокировку на volume. Второй экземпляр с тем же хранилищем завершится до запуска Telegram polling.

К сервису подключён volume с точкой монтирования `/data`. В нём находится `/data/metaflora.sqlite`:

- пользовательские профили и настройки;
- выбранные модели и их параметры;
- тарифные и метакоиновые балансы;
- реферальные связи, платежи, начисления и выводы;
- промокоды и факты их активации.

Файлы медиа-генераций сохраняются рядом в `/data/generated-media`. Пользователь получает короткую ссылку вида `https://<домен-бота>/f/<8-символьный-код>`; старый маршрут `/media/<непрозрачный-токен>` оставлен для совместимости и не показывается в новых кнопках. URL провайдера и URL Supabase в Telegram не попадают. Отдельный домен покупать не нужно: по умолчанию сокращатель работает на текущем домене бота. Другой HTTPS-домен можно подключить позже через `MEDIA_SHORT_BASE_URL`.

При запуске на Railway бот проверяет системную переменную `RAILWAY_VOLUME_MOUNT_PATH`. Без volume или при другой точке монтирования процесс завершится с ошибкой, чтобы не записывать рабочие данные во временную файловую систему контейнера.

## Обязательные переменные

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `BOT_OWNER_ID`
- `OWNER_METERED_ACCESS` — при `true` тестовый владелец не получает скрытый бесплатный bypass: генерация резервирует и списывает метакоины как у пользователя.
- `APP_DATABASE_PATH=/data/metaflora.sqlite`
- `METAFLORA_CUSTOM_EMOJI_FILE=/data/model-emoji-ids.json`
- `PUBLIC_BASE_URL=https://<домен-бота>`
- `MEDIA_SHORT_BASE_URL=https://<другой-домен>` — необязательно; без него используется `PUBLIC_BASE_URL` текущего бота
- `GENERATED_MEDIA_PATH=/data/generated-media`

Ключи провайдеров добавляются отдельными переменными. Платные генерации остаются выключенными при `ENABLE_PAID_PROVIDER_CALLS=false`.

## T-Bank/SBP checkout

Контур включается после настройки отдельного `metaflora-payment-demo` gateway. В сервисе бота укажи:

- `TBANK_CHECKOUT_ENABLED=true`
- `PAYMENT_GATEWAY_URL=https://<домен-gateway>/checkout`
- `PAYMENT_CHECKOUT_SECRET=<случайный секрет не короче 32 байт>`
- `PAYMENT_CALLBACK_SECRET=<другой случайный секрет не короче 32 байт>`
- `PAYMENT_TICKET_TTL_SECONDS=900`

В gateway значения `PAYMENT_CHECKOUT_SECRET` и `PAYMENT_CALLBACK_SECRET` должны совпадать с ботом. Переменная `BOT_TBANK_CALLBACK_URL` указывает на `https://<домен-бота>/internal/tbank/confirmed`. Checkout нельзя включать без Supabase/PostgreSQL history storage: локальная запись заказа нужна для проверки суммы, тарифа и повторных callback. Receipt получает сохранённый e-mail; сервис также принимает телефон в E.164.

Агентский каталог включается отдельно через `ENABLE_AGENT_PROVIDER_CALLS=true`. Этот флаг не включает остальные платные модели и инструменты. Для живого запуска нужен положительный баланс хотя бы у одного из маршрутов: Polza, OpenRouter или Requesty.

## Развёртывание

```bash
railway up --detach
railway status --json
railway logs --latest --lines 100
```

Успешный запуск содержит строки о регистрации Telegram-команд и состоянии провайдеров. Токены и ключи в эти строки не попадают.

## Промокоды

```bash
railway ssh npm run promo:generate -- \
  --code LAUNCH100 \
  --type metacoins \
  --value 100 \
  --uses 1000 \
  --expires 2026-12-31
```

Доступные типы:

- `metacoins`: однократно начисляет указанное число метакоинов;
- `discount_percent`: сохраняет скидку для следующего платёжного счёта.

Начисление метакоинов идемпотентно. Повторная доставка одной активации не увеличит баланс второй раз.

## Резервная копия

Перед изменением схемы или крупным релизом останови сервис и скопируй файл базы с volume. Для согласованной копии работающего сервиса используй SQLite backup-команду внутри контейнера:

```bash
railway ssh node -e \
  "const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync('/data/metaflora.sqlite'); db.exec(\"VACUUM INTO '/data/metaflora-backup.sqlite'\"); db.close();"
```

После создания копии её нужно забрать или перенести во внешнее защищённое хранилище. Не помещай базу в Git.

## Обновление

1. `npm test`
2. `npm audit --audit-level=high`
3. `docker build -t metaflora-neuro-bot:local .`
4. `railway up --detach`
5. `railway logs --latest --lines 100`

При `SIGTERM` бот прерывает текущий long polling, закрывает обе SQLite-сессии и завершает контейнер без повреждения базы.

## Чеки YooKassa

После нажатия «оплатить» бот один раз запрашивает настоящий e-mail. Адрес сохраняется в профиле пользователя и передаётся в YooKassa для фискального чека; следующая покупка уже не спрашивает его повторно. Без адреса платёжная ссылка не создаётся.

Если магазин требует фискальный чек уже при создании платежа, настрой в кабинете YooKassa сценарий «сначала платёж, потом чек» и опцию «не связывать чек и платёж» для сторонней кассы. При несовпадении настройки 400 исправляется в кабинете или через поддержку YooKassa, не ключом и не изменением Telegram-бота. Подробности есть в [документации YooKassa по сценариям чеков](https://yookassa.ru/developers/payment-acceptance/receipts/54fz/other-services/basics).
