# 🚀 ИНСТРУКЦИЯ ПО НАСТРОЙКЕ SUPABASE ДЛЯ CMS

## ⚠️ ВАЖНО: Выполнить ДО тестирования CMS

---

## Шаг 1: Создание таблиц

1. Открыть Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia
   ```

2. Перейти в **SQL Editor** (левое меню)

3. Нажать **New query**

4. Скопировать весь контент файла `supabase_cms_setup.sql`

5. Вставить в редактор и нажать **Run**

6. Проверить, что создались 5 таблиц:
   - `workshop_prompts`
   - `polygon_articles`
   - `academy_courses`
   - `academy_lessons`
   - `academy_videos`

---

## Шаг 2: Создание Storage бакетов

1. Перейти в **Storage** (левое меню)

2. Нажать **New bucket**

3. Создать 5 бакетов:

### Бакет 1: workshop-covers
- **Name:** `workshop-covers`
- **Public bucket:** ✅ Включить
- **File size limit:** 5MB
- **Allowed MIME types:** `image/png, image/jpeg, image/jpg, image/webp`

### Бакет 2: polygon-covers
- **Name:** `polygon-covers`
- **Public bucket:** ✅ Включить
- **File size limit:** 5MB
- **Allowed MIME types:** `image/png, image/jpeg, image/jpg, image/webp`

### Бакет 3: academy-covers
- **Name:** `academy-covers`
- **Public bucket:** ✅ Включить
- **File size limit:** 5MB
- **Allowed MIME types:** `image/png, image/jpeg, image/jpg, image/webp`

### Бакет 4: academy-videos
- **Name:** `academy-videos`
- **Public bucket:** ❌ Отключить (Private)
- **File size limit:** 100MB
- **Allowed MIME types:** `video/mp4, video/webm`

### Бакет 5: materials
- **Name:** `materials`
- **Public bucket:** ❌ Отключить (Private)
- **File size limit:** 50MB
- **Allowed MIME types:** `application/pdf, application/zip, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document`

---

## Шаг 3: Проверка настройки

1. Перейти в **Table Editor**

2. Убедиться, что видны все 5 таблиц

3. Перейти в **Storage**

4. Убедиться, что видны все 5 бакетов

---

## Шаг 4: Тестирование API

Проверить, что API endpoints работают:

```bash
# Получить список промптов (должен вернуть пустой массив)
curl https://service-production-f0b1.up.railway.app/api/content/workshop-prompts

# Ожидаемый ответ:
# {"data":[],"count":0}
```

---

## ✅ Готово!

Теперь можно:
1. Зайти в веб-сервис: https://service-production-f0b1.up.railway.app/dashboard/content
2. Создать первый промпт через CMS
3. Проверить, что он сохранился в Supabase
4. (После обновления мини-аппа) Увидеть его в мини-аппе

---

## 🆘 Если что-то не работает

### Ошибка: "relation does not exist"
- Таблицы не созданы
- Повторить Шаг 1

### Ошибка: "bucket not found"
- Бакеты не созданы
- Повторить Шаг 2

### Ошибка: "permission denied"
- Проверить RLS политики в Table Editor
- Для тестирования можно отключить RLS (Settings -> Policies -> Disable RLS)

---

## 📝 Дополнительная информация

**Supabase Project ID:** lwjsbflvsmscfrdkejia  
**Supabase URL:** https://lwjsbflvsmscfrdkejia.supabase.co  
**Anon Key:** (уже настроен в коде)

**Документация Supabase:**
- Таблицы: https://supabase.com/docs/guides/database/tables
- Storage: https://supabase.com/docs/guides/storage
