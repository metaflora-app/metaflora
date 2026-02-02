# Настройки уведомлений - Информация

## 📊 Таблица laba_notification_settings

Хранит настройки уведомлений для каждого отслеживаемого аккаунта.

### Структура

```sql
CREATE TABLE laba_notification_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tracked_account_id UUID REFERENCES laba_tracked_accounts(id),
  notifications_enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '08:00:00', -- UTC
  timezone TEXT DEFAULT 'Europe/Moscow',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, tracked_account_id)
);
```

### Поля

- **notifications_enabled** - включены/выключены уведомления для этого аккаунта
- **notification_time** - время отправки в формате HH:MM:SS (UTC)
- **timezone** - часовой пояс пользователя
- **UNIQUE(user_id, tracked_account_id)** - одна запись на пару пользователь+аккаунт

---

## 🔧 Как работают кнопки

### 1. "отключить уведомления"
```typescript
// Устанавливает notifications_enabled = false
await supabase
  .from('laba_notification_settings')
  .upsert({
    user_id: user.id,
    tracked_account_id: accountId,
    notifications_enabled: false,
  });
```

**Результат**: Уведомления для этого аккаунта отключены

### 2. "изменить время отправки уведомления"
**Статус**: В разработке

**Планируется**:
1. Пользователь нажимает кнопку
2. Бот просит написать время в формате HH:MM
3. Пользователь пишет "09:00"
4. Бот сохраняет в `notification_time`
5. Cron учитывает время при отправке

**Текущее поведение**: Отправляет сообщение что функция в разработке

### 3. "перестать отслеживать аккаунт"
```typescript
// ПОЛНОЕ УДАЛЕНИЕ аккаунта
await supabase
  .from('laba_tracked_accounts')
  .delete()
  .eq('id', accountId);
```

**Результат**: 
- Аккаунт удален из `laba_tracked_accounts`
- Все reels удалены (CASCADE)
- Настройки уведомлений удалены (CASCADE)

---

## 📝 Проверка настроек

### Посмотреть настройки пользователя
```sql
SELECT 
  ns.id,
  ns.notifications_enabled,
  ns.notification_time,
  ns.timezone,
  ta.instagram_username
FROM laba_notification_settings ns
JOIN laba_tracked_accounts ta ON ta.id = ns.tracked_account_id
WHERE ns.user_id = (SELECT id FROM users WHERE telegram_id = 994500304);
```

### Включить уведомления обратно
```sql
UPDATE laba_notification_settings
SET notifications_enabled = true
WHERE user_id = (SELECT id FROM users WHERE telegram_id = 994500304)
AND tracked_account_id = (SELECT id FROM laba_tracked_accounts WHERE instagram_username = 'mertzv2');
```

---

## 🎯 Логика отправки

Cron `/api/cron/send-notifications` проверяет:
1. `is_active = true` в `laba_tracked_accounts`
2. `notifications_enabled != false` в `laba_notification_settings`
3. `is_new = true` в `laba_reels`

Если все условия выполнены → отправляет уведомление.

---

**Дата**: 2026-02-02
**Таблица**: laba_notification_settings
**Миграция**: LABA_NOTIFICATION_SETTINGS_MIGRATION.sql
