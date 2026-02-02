# Исправление Telegram уведомлений - 2026-02-02 16:40

## ❌ Проблема

Уведомления не приходят в Telegram, хотя backend возвращает `"sent": true`.

## 🔍 Причина

В функции `sendTelegramMessage` отсутствовал `parse_mode: 'Markdown'`:
- Сообщения с Markdown форматированием (* для жирного) не отправлялись
- Telegram API возвращал ошибку, но она не логировалась

## ✅ Исправление

**Файл**: `lib/telegram.ts`

### Что добавлено:
1. `parse_mode: 'Markdown'` в sendMessage
2. Логирование ошибок Telegram API
3. Проверка `response.ok` и возврат `false` при ошибке

### Код:
```typescript
export async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown', // ← ДОБАВЛЕНО
        reply_markup: replyMarkup,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Telegram API error для пользователя ${chatId}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ ошибка отправки сообщения:', error);
    return false;
  }
}
```

## 🚀 Деплой

**Коммит**: `aec2f5b`
**Статус**: ✅ Запушено в main

Railway автоматически задеплоит (~2-3 минуты).

## 🧪 Тестирование

После деплоя:

1. Запустить отправку уведомлений:
```bash
curl https://service-production-f0b1.up.railway.app/api/cron/send-notifications
```

2. Проверить Telegram - должно прийти сообщение:
```
🥳 новые видео аккаунта @mertzv2

ссылки:
[10 ссылок на reels]
```

3. Проверить логи Railway:
- Должны быть сообщения "✅ уведомление отправлено"
- НЕ должно быть "❌ Telegram API error"

## 📝 Проверка переменных

Убедись что в Railway установлен `TELEGRAM_BOT_TOKEN`:
```
https://railway.app/project/metaflora-service → Variables → TELEGRAM_BOT_TOKEN
```

---

**Дата**: 2026-02-02 16:40
**Коммит**: `aec2f5b`
**Статус**: Готово к тестированию после деплоя
