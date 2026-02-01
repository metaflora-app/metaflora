# Критические исправления - 2026-02-01

## ✅ УЖЕ ИСПРАВЛЕНО

1. **Gap между кнопками**: 1px между всеми кнопками
2. **Z-index кнопки анализ**: 99999 (самый верхний слой)
3. **Кнопка "начать отслеживание"**: возвращена в LabaTrackedScreen

## ⚠️ ТРЕБУЕТСЯ ИСПРАВИТЬ (BACKEND)

### 1. Списание метакоинов
**Проблема**: Списывается 600+ метакоинов вместо 100
**Где**: Backend `app/api/laba/track-account/route.ts`
**Решение**: 
- Списывать ТОЛЬКО 100 метакоинов за добавление в отслеживаемые
- Скрапинг reels ВХОДИТ в эту стоимость
- НЕ списывать 15 метакоинов за каждое видео при первом добавлении

### 2. Ошибка повторного добавления
**Проблема**: Нельзя добавить аккаунт который ранее удалили
**Где**: Backend `app/api/laba/track-account/route.ts`
**Решение**: 
- Проверять не только `is_active = true`
- Если аккаунт существует с `is_active = false`, обновлять `is_active = true`
- НЕ создавать дубликат

### 3. Попапы при добавлении аккаунта
**Текущее**: Попап появляется после trackAccount
**Нужно**:
1. Попап ПЕРЕД скрапингом: "аккаунт добавлен в отслеживаемые вместе с последними опубликованными reels\n\nстоимость за каждое последующее видео после отслеживания — 15 метакоинов"
2. После закрытия попап: "найдено 40 reels\n\nсписано 100 метакоинов"
3. ТОЛЬКО ПОСЛЕ этого начинается скрапинг

### 4. Убрать лишний попап
**Проблема**: Появляется попап "reels успешно найдены" после скрапинга
**Решение**: Убрать этот попап из backend

## ⚠️ ТРЕБУЕТСЯ ИСПРАВИТЬ (FRONTEND)

### 1. BlurReelCard при скрапинге
**Проблема**: Показывается пустой фрейм вместо BlurReelCard
**Где**: `src/screens/laba-tracked/LabaTrackedScreen.tsx`
**Решение**: 
- Показывать BlurReelCard пока `scraping === true`
- Проверить что state `scraping` правильно устанавливается

### 2. Оптимизация LabaTrackedScreen
**Проблема**: 
- Тяжело грузит
- Показываются старые данные при возврате
- Пустое окошко с блюром

**Решение**:
- Добавить `React.memo` для ReelCard (уже есть)
- Очищать state при unmount
- Перезагружать данные при каждом возврате на экран
- Добавить loading state

### 3. Логика скрапинга
**Текущее**: Скрапинг начинается автоматически в LabaTrackedScreen
**Нужно**: Скрапинг должен начинаться ПОСЛЕ показа попапов

## 📝 Рекомендации

### Backend изменения (track-account/route.ts)

```typescript
// 1. Проверка существующего аккаунта
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
      accountId: existingAccount.id,
      showPopup: true,
      popupMessage: 'аккаунт реактивирован'
    });
  }
  
  // Если аккаунт уже активен
  return NextResponse.json({
    success: false,
    error: 'аккаунт уже отслеживается'
  });
}

// 2. Списание ТОЛЬКО 100 метакоинов
await supabase.rpc('deduct_metacoins', {
  p_user_id: userId,
  p_amount: 100,
  p_description: 'Добавление аккаунта в отслеживаемые'
});

// 3. НЕ списывать за каждое видео при первом добавлении
// Скрапинг reels ВХОДИТ в стоимость 100 метакоинов

// 4. Убрать попап "reels успешно найдены"
// Вместо этого возвращать данные без showPopup
```

### Frontend изменения (LabaSearchAccountScreen.tsx)

```typescript
const handleStartTracking = async () => {
  // 1. Показываем первый попап СРАЗУ
  if (window.Telegram?.WebApp?.showPopup) {
    window.Telegram.WebApp.showPopup({
      message: 'аккаунт добавлен в отслеживаемые вместе с последними опубликованными reels\n\nстоимость за каждое последующее видео после отслеживания — 15 метакоинов',
      buttons: [{ id: 'ok', type: 'default', text: 'Закрыть' }]
    }, async (buttonId) => {
      // 2. После закрытия показываем второй попап
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          message: 'найдено 40 reels\n\nсписано 100 метакоинов'
        });
      }
      
      // 3. ТОЛЬКО ПОСЛЕ попапов начинаем trackAccount
      try {
        setTracking(true);
        await trackAccount(foundAccount.username, userId);
        navigate('/laba-tracked');
      } catch (error) {
        // handle error
      } finally {
        setTracking(false);
      }
    });
  }
};
```

### Frontend изменения (LabaTrackedScreen.tsx)

```typescript
// Оптимизация загрузки
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

// Показываем BlurReelCard при скрапинге
{scraping && (
  <>
    <BlurReelCard index={0} />
    <BlurReelCard index={1} />
    <BlurReelCard index={2} />
    <BlurReelCard index={3} />
  </>
)}
```

## 🚨 КРИТИЧНО

**Списание метакоинов**: Это САМАЯ ВАЖНАЯ проблема. Пользователи теряют 600+ метакоинов вместо 100.

**Решение**: Изменить backend `track-account/route.ts`:
- Списывать ТОЛЬКО 100 метакоинов
- НЕ списывать 15 метакоинов за каждое видео при первом добавлении
- Скрапинг ВХОДИТ в стоимость 100 метакоинов
