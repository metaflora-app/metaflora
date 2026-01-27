# 🎯 ИНСТРУКЦИЯ ДЛЯ СЛЕДУЮЩЕГО АГЕНТА - CMS ПОЛИГОН

**Дата:** 2026-01-27  
**Статус:** ЦЕХ готов, ПОЛИГОН - активная работа

---

## ✅ ЧТО УЖЕ СДЕЛАНО

### Веб-сервис (metaflora-service):
- ✅ Экран "Цех карточка маленькая" - работает
- ✅ Экран "Цех карточка большая" - работает
- ✅ Preview компоненты для промптов
- ✅ Загрузка файлов (до 20MB)
- ✅ Автоматические ключевые слова
- ✅ Фильтр "новое" по умолчанию
- ✅ Кнопка "удалить карточку" → список промптов
- ✅ API endpoints для промптов
- ✅ Notion-like редактор контента для Полигона (базовый)
- ✅ polygon-card-small: карточка статьи 894×249px из мини-аппа
- ✅ polygon-card-small: кнопка "удалить карточку"
- ✅ polygon-card-small: фильтр только "новое"
- ✅ polygon-card-small: плашка "новое" из assets
- ✅ polygon-card-small: кнопка "читать" из assets
- ✅ ArticleCardLargePreview: поддержка content_blocks

### Мини-апп (metaflora):
- ✅ Динамическая загрузка промптов из API
- ✅ Поиск по ключевым словам с алертом при Enter
- ✅ Фильтры: новое, топ-выбор, недавние, избранное
- ✅ Лайки сохраняются в localStorage
- ✅ Кеш очищается принудительно при загрузке
- ✅ Кнопки "новое" (активная/неактивная) обновлены
- ✅ Поисковая строка очищается при пустом результате
- ✅ Типы обновлены: ContentBlock, content_blocks в PolygonArticle
- ✅ ArticleScreen: частичная интеграция с API

**Последние коммиты:**
- Веб-сервис: `dcefdeb feat: complete Notion-like editor - file uploads, no borders, scroll fade, materials counter` ✅ **ЗАДЕПЛОЕНО**
- Мини-апп: `c521067 feat: update types for content_blocks structure`

**ВАЖНО:** Версия `dcefdeb` задеплоена на Railway и работает! Все элементы на месте:
- ✅ Заголовок в 2 строки
- ✅ Зеленая кнопка деплой
- ✅ Панель действий с "добавить заголовок" и "добавить материал"
- ✅ Notion-like редактор с кнопками "+"
- ✅ Scroll fade на контент

**GitHub Token (в .env.local обоих проектов):**
```
GITHUB_TOKEN=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
```

**Supabase (уже в коде):**
```
URL: https://lwjsbflvsmscfrdkejia.supabase.co
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anNiZmx2c21zY2ZyZGtlamlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAyODMyMSwiZXhwIjoyMDg0NjA0MzIxfQ.zfYvrRAWoeRoOyc-wWTyQPGAzYRHTYPXZwNHL1CRcOY
```

---

## 🔑 КРЕДЕНШИАЛЫ И ДОСТУПЫ

**GitHub Token (для деплоя):**
```bash
# В .env.local обоих проектов:
GITHUB_TOKEN=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
```

**Команда деплоя веб-сервиса:**
```bash
cd /Users/user/.cursor/worktrees/_________/kra/metaflora-service
git add -A
git commit -m "fix: your commit message"
git remote set-url origin https://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@github.com/metaflora-app/service.git
git push origin clean-main:main
git remote set-url origin git@github.com:metaflora-app/service.git
```

**Команда деплоя мини-аппа:**
```bash
cd /Users/user/Desktop/метафлора
git add -A
git commit -m "fix: your commit message"
git remote set-url origin https://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@github.com/metaflora-app/metaflora.git
git push origin fix-bonus-with-photo:main
git remote set-url origin git@github.com:metaflora-app/metaflora.git
```

---

## ⚠️ КРИТИЧНЫЕ ПРОБЛЕМЫ

### 1. RLS Политики Supabase - ОБЯЗАТЕЛЬНО ВЫПОЛНИТЬ!

Зайди в Supabase SQL Editor (https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/sql/new):

```sql
-- Таблица polygon_articles
DROP POLICY IF EXISTS "Allow all operations for service role" ON polygon_articles;
CREATE POLICY "Allow all operations for service role"
ON polygon_articles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Storage для polygon-covers
DROP POLICY IF EXISTS "Allow public read access to polygon covers" ON storage.objects;
CREATE POLICY "Allow public read access to polygon covers"
ON storage.objects FOR SELECT USING (bucket_id = 'polygon-covers');

DROP POLICY IF EXISTS "Allow authenticated uploads to polygon covers" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to polygon covers"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'polygon-covers');

DROP POLICY IF EXISTS "Allow authenticated updates to polygon covers" ON storage.objects;
CREATE POLICY "Allow authenticated updates to polygon covers"
ON storage.objects FOR UPDATE USING (bucket_id = 'polygon-covers');

DROP POLICY IF EXISTS "Allow authenticated deletes to polygon covers" ON storage.objects;
CREATE POLICY "Allow authenticated deletes to polygon covers"
ON storage.objects FOR DELETE USING (bucket_id = 'polygon-covers');
```

### 2. polygon-card-large - ГОТОВО! ✅

**Файл:** `/Users/user/.cursor/worktrees/_________/kra/metaflora-service/app/dashboard/content/polygon-card-large/page.tsx`

**Текущая версия (коммит dcefdeb) - ЗАДЕПЛОЕНА:**
- ✅ Заголовок "карточка статьи" в 2 строки (lineHeight: 1.1)
- ✅ Кнопка "деплой" зеленая (#4CAF50) как в workshop-card-large
- ✅ Кнопка "удалить карточку" (красная)
- ✅ Панель "действия" с двумя секциями:
  - "добавить заголовок" с кнопкой "открыть"
  - "добавить материал" с кнопкой "открыть"
- ✅ Notion-like редактор с блоками (текст/фото/видео/промпт)
- ✅ Кнопки ↑ ↓ × для управления блоками
- ✅ Кнопки "+" для вставки блоков после каждого элемента
- ✅ Scroll fade на черную область контента (maskImage gradient)
- ✅ Правая карточка подвинута ближе (left: 1050px)
- ✅ Размеры: подложка 1004×1482px, черный фон 898×1376px
- ✅ FileUpload для фото/видео
- ✅ Секция "материалы" внизу (если есть загруженные файлы)
- ✅ Overflow: hidden на всех textarea/input

**Структура файла (1019 строк):**
- Заголовок в 2 строки
- Кнопка деплой (зеленая CSS button)
- Кнопка удалить карточку
- Панель действий (left: 353px, width: 481px)
- Превью карточки (left: 1050px, width: 1004px)

---

## 📋 ТЕКУЩЕЕ СОСТОЯНИЕ ПОЛИГОНА

### Веб-сервис (CMS) - ГОТОВО ✅
**Коммит:** `aa799ef` + следующий коммит

**polygon-card-large реализовано:**
- ✅ Заголовок "карточка статьи" в 1 строку
- ✅ Зеленая кнопка "деплой"
- ✅ Красная кнопка "удалить карточку"
- ✅ Панель "действия" расширяется вниз (minHeight, без скролла)
- ✅ Секция "добавить заголовок" с кнопкой "открыть"
- ✅ Секция "добавить материалы" с плюсиком
- ✅ FileUpload для материалов (любые файлы, multiple: true)
- ✅ Notion-like редактор с 4 плюсиками:
  - 1-й: текст (contentEditable, сохраняет абзацы)
  - 2-й: фото (FileUpload)
  - 3-й: материалы (плашка "материалы" + "скачать файлы (N)")
  - 4-й: промпт (contentEditable)
- ✅ Кнопки ↑ ↓ × для управления блоками
- ✅ Блок материалов показывает плашку PNG + кликабельный текст
- ✅ API endpoint /api/bot/send-materials для отправки в бота
- ✅ Правая карточка подвинута (left: 900px)
- ✅ Scroll fade на превью
- ✅ Расстояния между блоками: 15px

**ВАЖНО:** Нужно выполнить SQL из `SUPABASE_ALLOW_ALL_MIME_TYPES.sql` для загрузки файлов!

### Мини-апп - ТРЕБУЕТ ОБНОВЛЕНИЯ ⚠️

**Что нужно сделать:**

## 🎯 ЗАДАЧИ ДЛЯ СЛЕДУЮЩЕГО АГЕНТА - ПОЛИГОН

### 1. Обновить мини-апп для статей (КРИТИЧНО)

**Компоненты для мини-аппа (СОПОСТАВИТЬ!):**

**Экран "Все статьи в полигоне":**
- Путь: `/Users/user/.cursor/worktrees/_________/rpi/src/screens/poligon-articles-all/PoligonArticlesAllScreen.tsx`
- Функция: `renderArticleCard`
- Размеры: 894×249px
- Элементы: обложка, текст с blur, кнопка "читать", плашка "новое"

**Экран "Как выглядит статья":**
- Путь: `/Users/user/.cursor/worktrees/_________/rpi/src/screens/article/ArticleScreen.tsx`
- Должен отображать `content_blocks` из API
- Блоки: text, image, materials (не video!), prompt
- Блок materials показывает: плашку "материалы" + текст "скачать файлы (N)"
- При клике на текст - отправка материалов в бота

**ВАЖНО:** Типы уже обновлены в коммите `c521067`, но рендер блоков НЕ реализован!

### 2. Обновить форму polygon-card-small

**Требования:**
- Копировать ТОЧНЫЙ стиль и структуру из `workshop-card-small/page.tsx`
- Те же кнопки "открывашка" для каждого поля
- Те же размеры и позиции элементов
- Фильтры: новое, топ-выбор (как у промптов)
- Ключевые слова: массив строк

### 3. Обновить форму polygon-card-large

**Требования:**
- ✅ Notion-like редактор уже добавлен
- Кнопки: "+ текст", "+ фото", "+ видео", "+ промпт"
- Перемещение блоков: ↑ ↓
- Удаление блоков: ×
- Сохранение в `content_blocks` как JSON массив

### 4. Обновить API для Полигона

**Файл:** `/Users/user/.cursor/worktrees/_________/kra/metaflora-service/app/api/content/polygon-articles/route.ts`

**Изменить структуру данных:**
```typescript
// Вместо отдельных полей content_text, video_url, prompt_text
// Использовать единый массив content_blocks:
content_blocks: [
  { id: '1', type: 'text', content: '...' },
  { id: '2', type: 'image', content: 'https://...' },
  { id: '3', type: 'video', content: 'https://...' },
  { id: '4', type: 'prompt', content: '...' }
]
```

### 5. Обновить мини-апп для статей

**ArticleScreen.tsx:**
- Путь: `/Users/user/.cursor/worktrees/_________/rpi/src/screens/article/ArticleScreen.tsx`
- Рендерить `content_blocks` вместо статичного контента
- Каждый блок отображать в своем стиле:
  - `text` - обычный текст
  - `image` - картинка с border-radius
  - `video` - видео плеер
  - `prompt` - плашка "промпт" + текст промпта

**PoligonArticlesAllScreen.tsx:**
- Уже интегрирован с API
- Проверить что фильтры работают как у промптов

### 6. Обновить типы контента

**Файл:** `/Users/user/.cursor/worktrees/_________/rpi/src/types/content.ts`

**Добавить:**
```typescript
export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'prompt';
  content: string;
}

export interface PolygonArticle {
  // ... существующие поля
  content_blocks: ContentBlock[] | null; // ВМЕСТО content_text, video_url, prompt_text
}
```

### 7. Обновить Supabase таблицу

**SQL для выполнения:**
```sql
-- Добавить колонку content_blocks
ALTER TABLE polygon_articles
ADD COLUMN IF NOT EXISTS content_blocks JSONB;

-- Удалить старые колонки (после миграции данных)
-- ALTER TABLE polygon_articles DROP COLUMN content_text;
-- ALTER TABLE polygon_articles DROP COLUMN video_url;
-- ALTER TABLE polygon_articles DROP COLUMN prompt_text;
```

---

## 🔧 КОМАНДЫ ДЛЯ ДЕПЛОЯ

### Веб-сервис:
```bash
cd /Users/user/.cursor/worktrees/_________/kra/metaflora-service
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/metaflora_service_deploy
git add -A
git commit -m "feat: complete Polygon CMS with previews"
git push origin clean-main:main
```

### Мини-апп:
```bash
cd /Users/user/Desktop/метафлора
git add -A
git commit -m "feat: update ArticleScreen to render content blocks"
git push origin fix-bonus-with-photo:main
```

---

## 📝 ШАБЛОНЫ ДЛЯ КОПИРОВАНИЯ

**Для preview компонентов:**
- `PromptCardSmallPreview.tsx` → `ArticleCardSmallPreview.tsx`
- `PromptCardLargePreview.tsx` → `ArticleCardLargePreview.tsx`

**Для форм:**
- `workshop-card-small/page.tsx` → `polygon-card-small/page.tsx`
- `workshop-card-large/page.tsx` → `polygon-card-large/page.tsx` (уже обновлен с редактором)

**ВАЖНО:** Копируй ПОЛНОСТЬЮ компоненты карточек из мини-аппа, не придумывай свои!

---

## 🎯 ПРИОРИТЕТЫ

1. **КРИТИЧНО:** Создать ArticleCardSmallPreview и ArticleCardLargePreview
2. **ВЫСОКИЙ:** Обновить типы и API для content_blocks
3. **ВЫСОКИЙ:** Обновить ArticleScreen для рендера content_blocks
4. **СРЕДНИЙ:** Обновить polygon-card-small по стилю workshop-card-small
5. **НИЗКИЙ:** Академия (можно после Полигона)

---

**Удачи! 🚀**
