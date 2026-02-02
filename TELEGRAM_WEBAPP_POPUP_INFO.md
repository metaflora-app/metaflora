# Telegram WebApp Popup - Информация

## 📱 Название

Полное название: **Telegram WebApp Popup** (или **Telegram Mini App Alert**)

В документации Telegram: `window.Telegram.WebApp.showPopup()`

## 🎨 Внешний вид

Как на втором скрине:
- Заголовок: "Telegram"
- Текст сообщения
- Кнопка "Закрыть" (синяя)

## 📝 Использование

```typescript
window.Telegram.WebApp.showPopup({
  message: 'текст сообщения',
  buttons: [{ type: 'ok' }] // опционально
}, () => {
  // Callback после закрытия попапа
  console.log('Попап закрыт');
});
```

## 🔧 Параметры

### message
- Текст сообщения
- **Рекомендация**: с маленькой буквы, без восклицательного знака
- Пример: `успешно куплено 30000 метакоинов`

### buttons (опционально)
Массив кнопок:
- `{ type: 'ok' }` - кнопка "OK"
- `{ type: 'close' }` - кнопка "Закрыть"
- `{ type: 'cancel' }` - кнопка "Отмена"
- `{ id: 'custom', type: 'default', text: 'Текст' }` - кастомная кнопка

### callback (опционально)
Функция которая вызывается после закрытия попапа или нажатия кнопки.

## ✅ Исправления в MetacoinsScreen

### Было:
```typescript
message: `Успешно куплено ${amount} метакоинов!`
```

### Стало:
```typescript
message: `успешно куплено ${amount} метакоинов`,
buttons: [{ type: 'ok' }]
```

### Добавлен редирект:
После успешной покупки → переход на `/main-dashboard-premium`

```typescript
window.Telegram.WebApp.showPopup({
  message: `успешно куплено ${amount} метакоинов`,
  buttons: [{ type: 'ok' }]
}, () => {
  navigate('/main-dashboard-premium');
});
```

## 📚 Документация

Официальная документация Telegram WebApp API:
https://core.telegram.org/bots/webapps#popupparams

## 🎯 Стиль сообщений

**Правило**: все сообщения с маленькой буквы, без восклицательных знаков

**Примеры**:
- ✅ `успешно куплено 30000 метакоинов`
- ✅ `выберите количество метакоинов`
- ✅ `ошибка при покупке метакоинов`
- ❌ `Успешно куплено 30000 метакоинов!`
- ❌ `Выберите количество метакоинов!`

---

**Дата**: 2026-02-02
**Файл**: `src/screens/metacoins/MetacoinsScreen.tsx`
**Статус**: ✅ Исправлено
