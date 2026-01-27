# 📖 QUICK START ДЛЯ АГЕНТА

**Дата:** 2026-01-27  
**Проект:** Метафлора - CMS + мини-апп для Telegram

---

## 🎯 ТЕКУЩИЙ СТАТУС

### ✅ ГОТОВО:
- **ЦЕХ (Workshop)** - промпты полностью работают
- **ПОЛИГОН (Polygon)** - статьи полностью работают

### ⚠️ СЛЕДУЮЩАЯ ЗАДАЧА:
- **АКАДЕМИЯ (Academy)** - нужно реализовать

---

## 📄 ЧТО ЧИТАТЬ (В ПОРЯДКЕ ВАЖНОСТИ)

### 1. ИНСТРУКЦИЯ ДЛЯ АКАДЕМИИ (ГЛАВНОЕ):
```
/Users/user/Desktop/метафлора/ИНСТРУКЦИЯ_ДЛЯ_СЛЕДУЮЩЕГО_АГЕНТА_АКАДЕМИЯ.md
```
**Содержит:**
- Структуру Академии (курсы → уроки → видео)
- Схемы таблиц Supabase
- Список задач
- Референсы для копирования
- Команды деплоя

### 2. Статус Полигона (для понимания как делать):
```
/Users/user/Desktop/метафлора/ФИНАЛЬНЫЙ_СТАТУС_ПОЛИГОН.md
```
**Содержит:**
- Все исправления и решения
- Технические детали
- Структуру файлов
- Примеры кода

### 3. Типы данных:
```
/Users/user/Desktop/метафлора/src/types/content.ts
```
**Содержит:**
- Все интерфейсы (Workshop, Polygon, Academy)
- Типы для API
- Константы

---

## 🗂️ СТРУКТУРА ПРОЕКТА

### Веб-сервис (CMS):
```
/Users/user/.cursor/worktrees/_________/kra/metaflora-service/
├── app/
│   ├── api/content/ ← API endpoints
│   └── dashboard/content/ ← Формы CMS
│       ├── workshop-card-small/ ✅
│       ├── workshop-card-large/ ✅
│       ├── workshop-prompts-list/ ✅
│       ├── polygon-card-small/ ✅
│       ├── polygon-card-large/ ✅
│       ├── polygon-articles-list/ ✅
│       └── academy-* ← НУЖНО СОЗДАТЬ
└── public/assets/ ← Изображения
```

### Мини-апп:
```
/Users/user/Desktop/метафлора/
├── src/
│   ├── types/content.ts ← Типы данных
│   ├── utils/contentApi.ts ← API функции
│   ├── screens/ ← Экраны приложения
│   │   ├── prompt-first/ ✅ (Цех)
│   │   ├── poligon-articles-all/ ✅ (Полигон - список)
│   │   ├── article/ ✅ (Полигон - статья)
│   │   └── academy-* ← НУЖНО СОЗДАТЬ
│   └── assets/ ← Изображения
└── *.md ← Документация
```

---

## 🔑 КЛЮЧЕВЫЕ КОНЦЕПЦИИ

### 1. Структура данных:
```
ЦЕХ: промпты (одна сущность)
ПОЛИГОН: статьи (одна сущность + content_blocks)
АКАДЕМИЯ: курсы → уроки → видео (три сущности)
```

### 2. Паттерн форм в CMS:
```
*-card-small: маленькая карточка для создания
*-card-large: большая карточка с редактором
*-list: список для удаления
```

### 3. Паттерн экранов в мини-аппе:
```
*AllScreen: список карточек с фильтрами
*Screen: просмотр одной карточки
```

### 4. API паттерн:
```typescript
// Загрузка списка
getXWithCache({ filters }) → ContentListResponse<X>

// Загрузка одного
getXById(id) → ContentItemResponse<X>

// Создание/удаление через fetch
POST /api/content/X
DELETE /api/content/X/:id
```

---

## 📋 ПОСЛЕДНИЕ КОММИТЫ

### Мини-апп (`80c4b95`):
```
fix: final polish - spacing, search, filters

- Reduced spacing between text paragraphs (lineHeight: 1.3)
- Moved materials block higher (marginTop: 30px)
- Fixed expand button visibility
- Filters now single-select only
- Reduced spacing between article cards (280px step)
- Increased spacing from filters to first card (600px)
- Fixed search: Enter key triggers search, Telegram alert
```

### Веб-сервис (`8cbf86f`):
```
fix: restore image upload in service

Предыдущие:
- feat: add polygon articles list page for deletion (7b6f583)
- feat: add category selector to polygon-card-large (83d1116)
- feat: add SQL to allow all MIME types in materials bucket (cb34fcb)
```

---

## 🚀 БЫСТРЫЙ СТАРТ ДЛЯ АКАДЕМИИ

### Шаг 1: Изучить референсы
```bash
# Открыть эти файлы для копирования:
/Users/user/.cursor/worktrees/_________/kra/metaflora-service/app/dashboard/content/workshop-card-small/page.tsx
/Users/user/.cursor/worktrees/_________/kra/metaflora-service/app/dashboard/content/polygon-card-large/page.tsx
/Users/user/Desktop/метафлора/src/screens/poligon-articles-all/PoligonArticlesAllScreen.tsx
```

### Шаг 2: Создать базовые формы
```bash
# В веб-сервисе создать:
academy-course-card/page.tsx       # Форма курса
academy-lesson-card-small/page.tsx # Маленькая карточка урока
academy-lesson-card-large/page.tsx # Большая карточка урока
academy-courses-list/page.tsx      # Список курсов
academy-lessons-list/page.tsx      # Список уроков
```

### Шаг 3: Создать экраны в мини-аппе
```bash
# В мини-аппе создать:
academy-courses/AcademyCoursesScreen.tsx       # Выбор курса
academy-lessons/AcademyLessonsScreen.tsx       # Список уроков
academy-lesson/AcademyLessonScreen.tsx         # Просмотр урока
```

### Шаг 4: Добавить API для videos
```typescript
// В src/utils/contentApi.ts добавить:
getAcademyVideos(lessonId)
getAcademyVideoById(id)
```

---

## 📞 SUPABASE & CREDENTIALS

**Supabase URL:** `https://lwjsbflvsmscfrdkejia.supabase.co`  
**Service Role Key:** уже в `.env.local` веб-сервиса

**Бакеты Storage:**
- `workshop-covers` ✅
- `polygon-covers` ✅
- `academy-covers` ← создать
- `academy-videos` ← создать
- `materials` ✅

---

## ✅ ИТОГО

**ПРОЧИТАТЬ В ПЕРВУЮ ОЧЕРЕДЬ:**
1. `/Users/user/Desktop/метафлора/ИНСТРУКЦИЯ_ДЛЯ_СЛЕДУЮЩЕГО_АГЕНТА_АКАДЕМИЯ.md`
2. `/Users/user/Desktop/метафлора/ФИНАЛЬНЫЙ_СТАТУС_ПОЛИГОН.md`
3. `/Users/user/Desktop/метафлора/src/types/content.ts`

**РЕФЕРЕНСЫ ДЛЯ КОПИРОВАНИЯ:**
1. Веб-сервис: `workshop-*` и `polygon-*` формы
2. Мини-апп: `PoligonArticlesAllScreen` и `ArticleScreen`

**ЗАДАЧА:**
Реализовать Академию по аналогии с Цехом и Полигоном

---

**Дата создания:** 2026-01-27  
**Последние коммиты:**
- Мини-апп: `80c4b95`
- Веб-сервис: `8cbf86f`
