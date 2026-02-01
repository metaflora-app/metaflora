# Backend исправления - КРИТИЧНО

## 🚨 ЗАДАЧА 9: Исправить списание метакоинов

**Файл**: `app/api/laba/track-account/route.ts`

**Проблема**: Списывается 600+ метакоинов вместо 100

**Текущий код** (НЕПРАВИЛЬНО):
```typescript
// Списываем 150 метакоинов за добавление
await supabase.rpc('deduct_metacoins', {
  p_user_id: userId,
  p_amount: 150,
  p_description: 'Добавление аккаунта в отслеживаемые'
});

// Парсим 40 reels
const reels = await parseReels(username, 40);

// Списываем 15 метакоинов за КАЖДОЕ видео
for (const reel of reels) {
  await supabase.rpc('deduct_metacoins', {
    p_user_id: userId,
    p_amount: 15,
    p_description: `Reel ${reel.id}`
  });
}

// ИТОГО: 150 + (15 * 40) = 150 + 600 = 750 метакоинов
```

**Правильный код**:
```typescript
// Списываем ТОЛЬКО 100 метакоинов за добавление
// Скрапинг reels ВХОДИТ в эту стоимость
await supabase.rpc('deduct_metacoins', {
  p_user_id: userId,
  p_amount: 100,
  p_description: 'Добавление аккаунта в отслеживаемые (включая 40 reels)'
});

// Парсим 40 reels
const reels = await parseReels(username, 40);

// НЕ списываем метакоины за каждое видео при первом добавлении
// Сохраняем reels в БД без дополнительного списания

// ИТОГО: 100 метакоинов
```

---

## 🚨 ЗАДАЧА 10: Убрать лишний попап

**Файл**: `app/api/laba/track-account/route.ts` или где вызывается `scrapeAccountReels`

**Проблема**: После скрапинга появляется попап "reels успешно найдены"

**Найти и удалить**:
```typescript
// УДАЛИТЬ ЭТО:
return NextResponse.json({
  success: true,
  reelsAdded: reels.length,
  showPopup: true,  // <- УДАЛИТЬ
  popupMessage: 'reels успешно найдены'  // <- УДАЛИТЬ
});
```

**Правильный код**:
```typescript
// Возвращаем данные БЕЗ попапа
return NextResponse.json({
  success: true,
  reelsAdded: reels.length
  // БЕЗ showPopup и popupMessage
});
```

---

## 🚨 ЗАДАЧА 5: Исправить повторное добавление аккаунтов

**Файл**: `app/api/laba/track-account/route.ts`

**Проблема**: Нельзя добавить аккаунт который ранее удалили

**Текущий код** (НЕПРАВИЛЬНО):
```typescript
// Проверяем только активные аккаунты
const { data: existingAccount } = await supabase
  .from('laba_tracked_accounts')
  .select('*')
  .eq('user_id', userId)
  .eq('username', username)
  .eq('is_active', true)  // <- ПРОБЛЕМА: не находит удаленные
  .single();

if (existingAccount) {
  return NextResponse.json({
    success: false,
    error: 'аккаунт уже отслеживается'
  });
}

// Создаем новый аккаунт (ДУБЛИКАТ!)
```

**Правильный код**:
```typescript
// Проверяем ВСЕ аккаунты (включая удаленные)
const { data: existingAccount } = await supabase
  .from('laba_tracked_accounts')
  .select('*')
  .eq('user_id', userId)
  .eq('username', username)
  // БЕЗ .eq('is_active', true)
  .single();

if (existingAccount) {
  // Если аккаунт был удален - реактивируем
  if (!existingAccount.is_active) {
    await supabase
      .from('laba_tracked_accounts')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingAccount.id);
    
    // Списываем 100 метакоинов
    await supabase.rpc('deduct_metacoins', {
      p_user_id: userId,
      p_amount: 100,
      p_description: 'Реактивация аккаунта в отслеживаемые'
    });
    
    return NextResponse.json({
      success: true,
      accountId: existingAccount.id,
      message: 'аккаунт реактивирован'
    });
  }
  
  // Если аккаунт уже активен
  return NextResponse.json({
    success: false,
    error: 'аккаунт уже отслеживается'
  });
}

// Создаем новый аккаунт только если его нет
```

---

## 📝 Полный пример правильного кода

**Файл**: `app/api/laba/track-account/route.ts`

```typescript
export async function POST(request: Request) {
  try {
    const { username, userId } = await request.json();
    
    // 1. Проверяем существующий аккаунт (включая удаленные)
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
          .update({ 
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAccount.id);
        
        // Списываем 100 метакоинов за реактивацию
        await supabase.rpc('deduct_metacoins', {
          p_user_id: userId,
          p_amount: 100,
          p_description: 'Реактивация аккаунта в отслеживаемые'
        });
        
        return NextResponse.json({
          success: true,
          accountId: existingAccount.id
        });
      }
      
      // Если аккаунт уже активен
      return NextResponse.json({
        success: false,
        error: 'аккаунт уже отслеживается'
      });
    }
    
    // 2. Списываем ТОЛЬКО 100 метакоинов (включая скрапинг)
    await supabase.rpc('deduct_metacoins', {
      p_user_id: userId,
      p_amount: 100,
      p_description: 'Добавление аккаунта в отслеживаемые (включая 40 reels)'
    });
    
    // 3. Создаем новый аккаунт
    const { data: newAccount } = await supabase
      .from('laba_tracked_accounts')
      .insert({
        user_id: userId,
        username: username,
        is_active: true
      })
      .select()
      .single();
    
    // 4. Парсим 40 reels (БЕЗ дополнительного списания)
    const reels = await parseReels(username, 40);
    
    // 5. Сохраняем reels в БД
    await supabase
      .from('laba_reels')
      .insert(reels.map(reel => ({
        account_id: newAccount.id,
        ...reel
      })));
    
    // 6. Возвращаем результат БЕЗ попапа
    return NextResponse.json({
      success: true,
      accountId: newAccount.id,
      reelsAdded: reels.length
      // БЕЗ showPopup и popupMessage
    });
    
  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

---

## ✅ Чеклист изменений

- [ ] Списывать ТОЛЬКО 100 метакоинов за добавление
- [ ] НЕ списывать 15 метакоинов за каждое видео при первом добавлении
- [ ] Убрать `showPopup` и `popupMessage` из ответа
- [ ] Проверять ВСЕ аккаунты (не только is_active = true)
- [ ] Реактивировать удаленные аккаунты вместо создания дубликатов

---

## 🧪 Как протестировать

1. **Списание метакоинов**:
   - Добавить аккаунт в отслеживаемые
   - Проверить что списалось РОВНО 100 метакоинов (не 600+)

2. **Повторное добавление**:
   - Добавить аккаунт
   - Удалить аккаунт
   - Добавить тот же аккаунт снова
   - Должно работать без ошибки

3. **Попапы**:
   - Добавить аккаунт
   - НЕ должен появляться попап "reels успешно найдены"
   - Только попапы из frontend (2 штуки)

---

**Дата**: 2026-02-01
**Приоритет**: КРИТИЧНО
**Статус**: Требует немедленного исправления
