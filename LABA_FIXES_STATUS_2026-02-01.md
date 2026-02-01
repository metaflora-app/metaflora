# Статус исправлений Лабы - 2026-02-01 14:33

## ✅ ИСПРАВЛЕНО И ЗАДЕПЛОЕНО

### 1. Gap между кнопками
**Статус**: ✅ Исправлено
**Файл**: `src/screens/laba-tracked/LabaTrackedScreen.tsx`
**Изменение**: Gap 1px между всеми кнопками
- Вернуть: `left: 232px` (gap 1px от плюса)
- Сортировка: `left: 503px` (gap 1px от вернуть)
- Выбрать: `left: 774px` (gap 1px от сортировка)

### 2. Z-index кнопки "анализ"
**Статус**: ✅ Исправлено
**Файл**: `src/components/ReelCard.tsx`
**Изменение**: `zIndex: 99999` (самый верхний слой)

### 3. Кнопка "начать отслеживание"
**Статус**: ✅ Возвращена
**Файл**: `src/screens/laba-tracked/LabaTrackedScreen.tsx`
**Изменение**: Добавлена кнопка при `accountRemoved === true`

---

## ⚠️ ТРЕБУЕТСЯ ИСПРАВИТЬ (КРИТИЧНО)

### 4. Списание метакоинов
**Статус**: ❌ НЕ ИСПРАВЛЕНО (BACKEND)
**Проблема**: Списывается 600+ метакоинов вместо 100
**Где**: Backend `app/api/laba/track-account/route.ts`
**Решение**: 
```typescript
// Списывать ТОЛЬКО 100 метакоинов
await supabase.rpc('deduct_metacoins', {
  p_user_id: userId,
  p_amount: 100,
  p_description: 'Добавление аккаунта в отслеживаемые'
});

// НЕ списывать 15 метакоинов за каждое видео при первом добавлении
// Скрапинг reels ВХОДИТ в стоимость 100 метакоинов
```

### 5. Ошибка повторного добавления
**Статус**: ❌ НЕ ИСПРАВЛЕНО (BACKEND)
**Проблема**: Нельзя добавить аккаунт который ранее удалили
**Где**: Backend `app/api/laba/track-account/route.ts`
**Решение**:
```typescript
// Проверка существующего аккаунта
const { data: existingAccount } = await supabase
  .from('laba_tracked_accounts')
  .select('*')
  .eq('user_id', userId)
  .eq('username', username)
  .single();

if (existingAccount) {
  // Если аккаунт был удален - реактивируем
  if (!existingAccount.is_active) {
    await supabase
      .from('laba_tracked_accounts')
      .update({ is_active: true })
      .eq('id', existingAccount.id);
    
    return NextResponse.json({
      success: true,
      accountId: existingAccount.id
    });
  }
}
```

### 6. Попапы при добавлении аккаунта
**Статус**: ⚠️ ЧАСТИЧНО ИСПРАВЛЕНО
**Проблема**: Попапы показываются в неправильном порядке
**Где**: `src/screens/laba-search-account/LabaSearchAccountScreen.tsx`
**Нужно**:
1. Попап СРАЗУ при клике: "аккаунт добавлен в отслеживаемые вместе с последними опубликованными reels\n\nстоимость за каждое последующее видео после отслеживания — 15 метакоинов"
2. После закрытия попап: "найдено 40 reels\n\nсписано 100 метакоинов"
3. ТОЛЬКО ПОСЛЕ этого начинается trackAccount и скрапинг

### 7. Лишний попап после скрапинга
**Статус**: ❌ НЕ ИСПРАВЛЕНО (BACKEND)
**Проблема**: Появляется попап "reels успешно найдены"
**Где**: Backend `app/api/laba/track-account/route.ts` или `scrapeAccountReels`
**Решение**: Убрать `showPopup: true` из ответа

### 8. BlurReelCard при скрапинге
**Статус**: ❌ НЕ ИСПРАВЛЕНО
**Проблема**: Показывается пустой фрейм вместо BlurReelCard
**Где**: `src/screens/laba-tracked/LabaTrackedScreen.tsx`
**Решение**:
```typescript
// Показывать BlurReelCard пока scraping === true
{scraping && (
  <>
    <BlurReelCard index={0} />
    <BlurReelCard index={1} />
    <BlurReelCard index={2} />
    <BlurReelCard index={3} />
  </>
)}
```

### 9. Оптимизация LabaTrackedScreen
**Статус**: ❌ НЕ ИСПРАВЛЕНО
**Проблема**: 
- Тяжело грузит
- Показываются старые данные при возврате
- Пустое окошко с блюром

**Решение**:
```typescript
React.useEffect(() => {
  const fetchAccounts = async () => {
    setLoading(true);
    const trackedAccounts = await getTrackedAccounts(userId);
    setAccounts(trackedAccounts);
    setLoading(false);
  };
  
  fetchAccounts();
  
  // Перезагружаем при возврате на экран
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      fetchAccounts();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    // Очищаем state при unmount
    setAccounts([]);
    setReels([]);
  };
}, [userId]);
```

---

## 📊 Статистика

**Коммит**: `b50777f`
**Сообщение**: `fix(laba): частичные исправления UI + документация критических проблем`

**Файлы изменены**: 4
- `src/screens/laba-tracked/LabaTrackedScreen.tsx`
- `src/components/ReelCard.tsx`
- `src/screens/laba-search-account/LabaSearchAccountScreen.tsx`
- `CRITICAL_FIXES_NEEDED.md` (новый)

**Исправлено**: 3 из 11 задач
**Осталось**: 8 задач (6 требуют backend изменений)

---

## 🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### 1. Списание метакоинов (САМОЕ ВАЖНОЕ!)
Пользователи теряют 600+ метакоинов вместо 100. Это КРИТИЧНО!

**Требуется**: Изменить backend `track-account/route.ts`

### 2. Повторное добавление аккаунтов
Пользователи не могут повторно добавить удаленные аккаунты.

**Требуется**: Изменить backend `track-account/route.ts`

### 3. Попапы и UX
Неправильный порядок попапов сбивает пользователей.

**Требуется**: Изменить frontend + backend

---

## 📝 Рекомендации

1. **СРОЧНО**: Исправить списание метакоинов в backend
2. **СРОЧНО**: Исправить повторное добавление аккаунтов
3. Переделать логику попапов (frontend + backend)
4. Оптимизировать LabaTrackedScreen
5. Исправить отображение BlurReelCard

---

## 🔗 Ссылки

**Frontend**: https://web-production-fc84.up.railway.app
**Backend**: https://service-production-f0b1.up.railway.app

**Документация**: `CRITICAL_FIXES_NEEDED.md`

---

**Дата**: 2026-02-01 14:33
**Статус**: Частично исправлено (3/11)
**Следующий шаг**: Backend изменения (списание метакоинов)
