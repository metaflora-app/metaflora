# 🎯 ИНСТРУКЦИЯ ДЛЯ СЛЕДУЮЩЕГО АГЕНТА - CMS ПОЛИГОН

**Дата:** 2026-01-27  
**Статус:** ЦЕХ готов, ПОЛИГОН в процессе

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
- ✅ Notion-like редактор контента для Полигона (добавление блоков: текст/фото/видео/промпт в любом порядке)

### Мини-апп (metaflora):
- ✅ Динамическая загрузка промптов из API
- ✅ Поиск по ключевым словам с алертом при Enter
- ✅ Фильтры: новое, топ-выбор, недавние, избранное
- ✅ Лайки сохраняются в localStorage
- ✅ Кеш очищается принудительно при загрузке
- ✅ Кнопки "новое" (активная/неактивная) обновлены
- ✅ Поисковая строка очищается при пустом результате

**Последние коммиты:**
- Веб-сервис: `0fb7eb5 feat: add notion-like content editor for polygon`
- Мини-апп: `dd9acbd fix: force clear all workshop prompts cache on load`

---

## 🎯 ЗАДАЧИ ДЛЯ СЛЕДУЮЩЕГО АГЕНТА - ПОЛИГОН

### 1. Создать preview компоненты для статей (КРИТИЧНО)

**ArticleCardSmallPreview.tsx:**
- Путь: `/Users/user/.cursor/worktrees/_________/kra/metaflora-service/components/previews/ArticleCardSmallPreview.tsx`
- Скопировать ТОЧНУЮ структуру карточки из `/Users/user/.cursor/worktrees/_________/rpi/src/screens/poligon-articles-all/PoligonArticlesAllScreen.tsx` (функция renderArticleCard)
- Размеры: 894×249px
- Элементы: обложка (450px), текстовый блок с blur, кнопка "читать", плашка "новое"
- Динамическое обновление при вводе данных

**ArticleCardLargePreview.tsx:**
- Путь: `/Users/user/.cursor/worktrees/_________/kra/metaflora-service/components/previews/ArticleCardLargePreview.tsx`
- Скопировать структуру из `/Users/user/.cursor/worktrees/_________/rpi/src/screens/article/ArticleScreen.tsx`
- Отображать content_blocks в правильном порядке (текст/фото/видео/промпт)
- Масштаб: scale(0.5) для превью

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
