# Исправление Instagram Profile Scraper - 2026-02-01

## Проблема

Поиск Instagram профиля не работал - Actor `apify/instagram-scraper` с `resultsType: 'details'` завершался успешно, но возвращал пустой dataset (0 items).

**Логи ошибки:**
```
2026-02-01T08:34:36.183Z INFO  CheerioCrawler: Final request statistics: {"requestsFinished":1,"requestsFailed":0}
2026-02-01T08:34:36.184Z INFO  CheerioCrawler: Finished! Total 1 requests: 1 succeeded, 0 failed.
```

Actor завершался успешно, но не возвращал данные.

---

## Решение

Заменен Actor на `apify/instagram-profile-scraper`, который специализируется на парсинге профилей.

### Изменения в коде

**Файл:** `metaflora-service/lib/apify.ts`

**Было:**
```typescript
const run = await apifyClient.actor('apify/instagram-scraper').call({
  directUrls: [`https://www.instagram.com/${username}/`],
  resultsType: 'details',
});

const profile = items[0] as unknown as InstagramProfileData;
```

**Стало:**
```typescript
const run = await apifyClient.actor('apify/instagram-profile-scraper').call({
  usernames: [username],
});

const rawProfile = items[0] as any;

// Маппинг данных из instagram-profile-scraper в наш формат
const profile: InstagramProfileData = {
  username: rawProfile.username,
  id: rawProfile.id || rawProfile.fbid || '',
  fullName: rawProfile.fullName || '',
  biography: rawProfile.biography || '',
  followersCount: rawProfile.followersCount || 0,
  followsCount: rawProfile.followsCount || 0,
  postsCount: rawProfile.postsCount || 0,
  profilePicUrl: rawProfile.profilePicUrl || rawProfile.profilePicUrlHD || '',
  verified: rawProfile.verified || false,
  private: rawProfile.private || false,
};
```

---

## Тестирование

Протестировано на аккаунте `@natgeo`:

**Результат:**
```json
{
  "fullName": "National Geographic",
  "postsCount": 31324,
  "followersCount": 275578210,
  "followsCount": 173,
  "biography": "Inspiring the explorer in everyone 🌎",
  "profilePicUrl": "https://...",
  "username": "natgeo",
  "private": false,
  "verified": true,
  "isBusinessAccount": true
}
```

✅ Actor работает корректно и возвращает все необходимые данные.

---

## Деплой

**Коммит:** `84583f3`
**Репозиторий:** `metaflora-app/service`
**Ветка:** `main`

**Команда:**
```bash
cd /Users/user/Desktop/metaflora-service
git add lib/apify.ts
git commit -m "fix: заменен Instagram scraper на instagram-profile-scraper"
git push origin main
```

**URL:** https://service-production-f0b1.up.railway.app

---

## Что было исправлено

1. ✅ Заменен Actor: `apify/instagram-scraper` → `apify/instagram-profile-scraper`
2. ✅ Изменены параметры: `directUrls` + `resultsType` → `usernames`
3. ✅ Добавлен маппинг данных для корректной работы
4. ✅ Добавлено логирование raw данных для отладки
5. ✅ Обновлена версия в комментариях: 1.0 → 1.1

---

## Преимущества нового Actor

1. **Специализация:** `instagram-profile-scraper` создан специально для парсинга профилей
2. **Надежность:** Стабильно возвращает данные
3. **Простота:** Принимает массив usernames, не требует полных URL
4. **Скорость:** Быстрее работает для одиночных профилей

---

## Проверка работы

### API endpoint: `/api/laba/search-account`

**Запрос:**
```bash
curl -X POST https://service-production-f0b1.up.railway.app/api/laba/search-account \
  -H "Content-Type: application/json" \
  -d '{"query": "natgeo"}'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "account": {
    "username": "natgeo",
    "instagramUserId": "787132",
    "followersCount": 275578210,
    "profilePhotoUrl": "https://..."
  }
}
```

### Frontend: LabaSearchAccountScreen

1. Открыть мини-апп: https://web-production-fc84.up.railway.app
2. Перейти в раздел "Лаба"
3. Нажать "Добавить аккаунт"
4. Ввести ник: `natgeo`
5. Должен найтись профиль с аватаркой и количеством подписчиков

---

## Статус

✅ **Исправлено**
✅ **Задеплоено**
✅ **Протестировано**

**Дата:** 2026-02-01 11:50
**Коммит:** 84583f3
**Статус:** Готово к использованию

---

## Для следующего агента

Если поиск профиля снова не работает:

1. Проверить логи Railway: https://railway.app
2. Проверить что Apify token настроен: `APIFY_API_TOKEN`
3. Проверить что Actor доступен: https://console.apify.com/actors/dSCLg0C3YEZ83HzYX
4. Проверить логи в коде: `console.log('📊 Raw item:', ...)`

**Actor ID:** `apify/instagram-profile-scraper`
**Документация:** https://apify.com/apify/instagram-profile-scraper
