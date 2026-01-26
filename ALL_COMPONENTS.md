# МЕТАФЛОРА* - Все актуальные компоненты

**Дата:** 25 января 2026  
**Проект:** Telegram Mini App  
**Production:** https://web-production-fc84.up.railway.app  
**GitHub:** https://github.com/metaflora-app/metaflora

## 💰 Стоимость действий (метакоины):

| Действие | Стоимость | Экран | Кнопка |
|----------|-----------|-------|--------|
| Регистрация | 0 | SplashScreen | Автоматически |
| Подписка 1 мес | +150 | PricingScreen | "оплатить полный доступ" |
| Подписка 3 мес | +500 | PricingScreen | "оплатить полный доступ" |
| Покупка 5000 | +5000 | MetacoinsScreen | "купить метакоины" |
| Покупка 25000 | +25000 | MetacoinsScreen | "купить метакоины" |
| Анализ | -100 | LabaAnalysisScreen | "начать анализ" |
| Сценарий | -50 | LabaAnalysisScreen | "создать сценарий" |
| Поиск | -25 | LabaSearchAccountScreen | "начать отслеживание" |
| Слежка | -100 | LabaSearchAccountScreen | "начать отслеживание" |

## 🔗 Связанные файлы:

- **Проблема Supabase:** `/Users/user/.cursor/worktrees/_________/lct/ТЕКУЩАЯ_ПРОБЛЕМА_SUPABASE.md`
- **Интеграция Supabase:** `/Users/user/.cursor/worktrees/_________/lct/SUPABASE_INTEGRATION.md`
- **Веб-сервис:** `/Users/user/.cursor/worktrees/_________/kra/metaflora-service/ПОЛНОЕ_ОПИСАНИЕ_ПРОЕКТА.md`

---

## 📱 Экраны (34 компонента)

### Onboarding (6 экранов)

#### 1. SplashScreen
- **Путь:** `/splash`
- **Файл:** `src/screens/splash/SplashScreen.tsx`
- **Описание:** Загрузочный экран с авто-редиректом

#### 2. WelcomeScreen
- **Путь:** `/welcome`
- **Файл:** `src/screens/welcome/WelcomeScreen.tsx`
- **Описание:** Приветственный экран с каруселью

#### 3. TourVideoScreen
- **Путь:** `/tour-video`
- **Файл:** `src/screens/tour-video/TourVideoScreen.tsx`
- **Описание:** Обучающее видео

#### 4. DemoAccessScreen
- **Путь:** `/demo-access`
- **Файл:** `src/screens/demo-access/DemoAccessScreen.tsx`
- **Описание:** Информация о демо-доступе

#### 5. PricingScreen
- **Путь:** `/pricing`
- **Файл:** `src/screens/pricing/PricingScreen.tsx`
- **Описание:** Тарифные планы

#### 6. MainDashboardFreeScreen & MainDashboardPremiumScreen
- **Пути:** `/main-dashboard-free`, `/main-dashboard-premium`
- **Файлы:** 
  - `src/screens/main-dashboard-free/MainDashboardFreeScreen.tsx`
  - `src/screens/main-dashboard-premium/MainDashboardPremiumScreen.tsx`
- **Описание:** Главные дашборды (бесплатный/премиум)

---

### Промпт/Цех (3 экрана)

#### 7. AboutPromptScreen
- **Путь:** `/about-prompt`
- **Файл:** `src/screens/about-prompt/AboutPromptScreen.tsx`
- **Описание:** Вводное видео о промптах

#### 8. PromptFirstScreen
- **Путь:** `/prompt-first`
- **Файл:** `src/screens/prompt-first/PromptFirstScreen.tsx`
- **Описание:** Каталог промптов с фильтрами

#### 9. PromptCardScreen
- **Путь:** `/prompt-card`
- **Файл:** `src/screens/prompt-card/PromptCardScreen.tsx`
- **Описание:** Детальная карточка промпта

---

### Академия (8 экранов)

#### 10. AboutAcademyScreen
- **Путь:** `/about-academy`
- **Файл:** `src/screens/about-academy/AboutAcademyScreen.tsx`
- **Описание:** Вводное видео об академии

#### 11. AcademyCoursesAllScreen
- **Путь:** `/academy-courses-all`
- **Файл:** `src/screens/academy-courses-all/AcademyCoursesAllScreen.tsx`
- **Описание:** Библиотека всех курсов

#### 12-15. Academy Course Screens
- **Пути:**
  - `/academy-course-system`
  - `/academy-course-art`
  - `/academy-course-prompting`
  - `/academy-course-automation`
- **Файлы:**
  - `src/screens/academy-course-system/AcademyCourseSystemScreen.tsx`
  - `src/screens/academy-course-art/AcademyCourseArtScreen.tsx`
  - `src/screens/academy-course-prompting/AcademyCoursePromptingScreen.tsx`
  - `src/screens/academy-course-automation/AcademyCourseAutomationScreen.tsx`
- **Описание:** 4 экрана курсов (система, искусство, промптинг, автоматизация)

#### 16. AcademyLessonVideoScreen
- **Путь:** `/academy-lesson-video`
- **Файл:** `src/screens/academy-lesson-video/AcademyLessonVideoScreen.tsx`
- **Описание:** Плеер для видео урока

#### 17. AcademyLessonMaterialsScreen
- **Путь:** `/academy-lesson-materials`
- **Файл:** `src/screens/academy-lesson-materials/AcademyLessonMaterialsScreen.tsx`
- **Описание:** Материалы урока

---

### Полигон (3 экрана)

#### 18. AboutPoligonScreen
- **Путь:** `/about-poligon`
- **Файл:** `src/screens/about-poligon/AboutPoligonScreen.tsx`
- **Описание:** Вводное видео о полигоне

#### 19. PoligonArticlesAllScreen
- **Путь:** `/poligon-articles-all`
- **Файл:** `src/screens/poligon-articles-all/PoligonArticlesAllScreen.tsx`
- **Описание:** Каталог статей с поиском

#### 20. ArticleScreen
- **Путь:** `/article`
- **Файл:** `src/screens/article/ArticleScreen.tsx`
- **Описание:** Детальный просмотр статьи (скроллируемый)

---

### Лаба (9 экранов) ⭐ АКТУАЛЬНЫЕ

#### 21. AboutLabaScreen
- **Путь:** `/about-laba`
- **Файл:** `src/screens/about-laba/AboutLabaScreen.tsx`
- **Описание:** Вводное видео о лабе

#### 22. LabaLoadingScreen
- **Путь:** `/laba-loading`
- **Файл:** `src/screens/laba-loading/LabaLoadingScreen.tsx`
- **Описание:** Экран загрузки лабы с превью слева/справа
- **Особенности:**
  - Кнопка "открыть" → /laba-main
  - 4 навигационные иконки в нижнем сайдбаре
  - PNG "на избранное" (387x372px)

#### 23. LabaSearchScreen ⭐ САМЫЙ АКТУАЛЬНЫЙ
- **Путь:** `/laba-search`
- **Файл:** `src/screens/laba-search/LabaSearchScreen.tsx`
- **Описание:** Экран поиска по лабе
- **Особенности:**
  - Draggable скролл перемещения (131x131px) at x=301, y=1879
  - Магнитное притяжение к 4 позициям иконок
  - Невидимые кнопки навигации:
    - x=241: /laba-main
    - x=393: /laba-no-tracked
    - x=598: /laba-favorites
    - x=741: /metacoins
  - Сайдбар PNG (688x139px) с pointerEvents: 'none'
  - Скролл рендерится ПЕРЕД сайдбаром (под иконками)

#### 24. LabaMainScreen
- **Путь:** `/laba-main`
- **Файл:** `src/screens/laba-main/LabaMainScreen.tsx`
- **Описание:** Главная лента промптов (4 карточки в сетке 2x2)
- **Особенности:**
  - Фильтры Row 1: вернуть, сортировка, дата, язык (247x79px каждая)
  - Фильтры Row 2: виральность, аккаунт, формат (247x79px каждая)
  - Плашки активные/неактивные (186x79px)
  - Popup тексты для фильтров:
    - Сортировка: >просмотров, <просмотров, >лайков, <лайков, >комментариев, <комментариев
    - Дата: последние 7/14/30 дней, 6 месяцев, год
    - Язык: русский, английский, испанский, турецкий, французский
    - Виральность: 0-2, 3-5, 6-8, 9-10 баллов
    - Аккаунт: 0-10k, 10k-100k, 100k-300k, 300k-1млн, больше 1млн
  - Интерактивные лайки на карточках (клик = красный)
  - Плашка "новое" PNG на всех карточках (101x36px at x=269, y=44)
  - Точные координаты из Figma metadata

#### 25. LabaFavoritesScreen
- **Путь:** `/laba-favorites`
- **Файл:** `src/screens/laba-favorites/LabaFavoritesScreen.tsx`
- **Описание:** Избранные промпты (ПОЛНЫЙ дубликат LabaMainScreen)
- **Особенности:**
  - ВСЕ сердечки красные по дефолту (likedCards: [1,2,3,4])
  - Идентичная структура с LabaMainScreen
  - Те же фильтры и плашки

#### 26. LabaNoTrackedScreen
- **Путь:** `/laba-no-tracked`
- **Файл:** `src/screens/laba-no-tracked/LabaNoTrackedScreen.tsx`
- **Описание:** Экран "нет отслеживаемых аккаунтов"

#### 27. LabaTrackedScreen
- **Путь:** `/laba-tracked`
- **Файл:** `src/screens/laba-tracked/LabaTrackedScreen.tsx`
- **Описание:** Список отслеживаемых аккаунтов

#### 28. LabaSearchAccountScreen
- **Путь:** `/laba-search-account`
- **Файл:** `src/screens/laba-search-account/LabaSearchAccountScreen.tsx`
- **Описание:** Поиск аккаунта для отслеживания

#### 29. LabaAnalysisScreen
- **Путь:** `/laba-analysis`
- **Файл:** `src/screens/laba-analysis/LabaAnalysisScreen.tsx`
- **Описание:** Анализ контента (свернутый/развернутый)

---

### Metacoins (1 экран)

#### 30. MetacoinsScreen
- **Путь:** `/metacoins`
- **Файл:** `src/screens/metacoins/MetacoinsScreen.tsx`
- **Описание:** Экран пополнения баланса

---

### Legal (2 экрана)

#### 31. PrivacyPolicyScreen
- **Путь:** `/privacy-policy`
- **Файл:** `src/screens/privacy-policy/PrivacyPolicyScreen.tsx`
- **Описание:** Политика конфиденциальности

#### 32. MarketingConsentScreen
- **Путь:** `/marketing-consent`
- **Файл:** `src/screens/marketing-consent/MarketingConsentScreen.tsx`
- **Описание:** Согласие на маркетинг

---

## 🎨 Ключевые Assets

### Laba Main Buttons (src/assets/laba-main-buttons/)
- **Кнопки фильтров (247x80px PNG @1x):**
  - кнопка вернуть.png
  - кнопка сортировка.png / неактив.png
  - кнопка дата.png / неактив.png
  - кнопка язык.png / неактив.png
  - кнопка виральность.png / неактив.png
  - кнопка аккаунт.png / неактив.png
  - кнопка формат.png

- **Плашки фильтров (558x237px PNG @3x → 186x79px display):**
  - плашка лайки.png / неактив.png
  - плашка таймслот.png / неактив.png
  - плашка русский.png / неактив.png
  - плашка баллы.png / неактив.png
  - плашка аккаунт.png / неактив.png
  - плашка рилс.png

- **Навигационные элементы:**
  - на избранное.png (387x372px)
  - скролл перемещения.png (393x393px @3x → 131x131px display)

- **Карточки:**
  - плашка новое.png (101x36px)
  - кнопка анализ.png (248x79px)

### Laba Screens Assets (src/assets/laba-screens/)
- слева.png (428x1820px - превью контента)
- справа.png (428x1820px - превью контента)
- сайдбар.png (688x139px - навигационная панель)

---

## 🔄 Навигационные потоки

### Лаба Section Flow
```
/laba-loading
  ├─ [кнопка "открыть"] → /laba-main
  └─ [иконка "на избранное"] → /laba-favorites

/laba-search (АКТУАЛЬНЫЙ)
  └─ [draggable скролл]
      ├─ snap x=241 → /laba-main
      ├─ snap x=393 → /laba-no-tracked
      ├─ snap x=598 → /laba-favorites
      └─ snap x=741 → /metacoins

/laba-main
  ├─ [карточка "анализ"] → /laba-analysis
  ├─ [фильтры] → показывает popup с опциями
  └─ [лайк] → toggle красный/белый

/laba-favorites (дубликат laba-main)
  └─ [все лайки красные по дефолту]
```

---

## 🎯 Фичи и Паттерны

### 1. Draggable Scroll Indicator (LabaSearchScreen)
```typescript
// State
const [scrollPosition, setScrollPosition] = useState({ x: 301, y: 1879 });
const [isDragging, setIsDragging] = useState(false);
const [activeButton, setActiveButton] = useState<string | null>(null);

// Button positions
const buttonPositions = [
  { id: 'main', x: 241, y: 1882, route: '/laba-main' },
  { id: 'tracked', x: 393, y: 1882, route: '/laba-no-tracked' },
  { id: 'favorites', x: 598, y: 1882, route: '/laba-favorites' },
  { id: 'balance', x: 741, y: 1880, route: '/metacoins' },
];

// Magnetic snap threshold: 50px
// DOM order: scroll → sidebar → invisible buttons
// Layering: scroll under icons, buttons on top
```

### 2. Filter System (LabaMainScreen, LabaFavoritesScreen)
```typescript
// States
const [selectedSort, setSelectedSort] = useState<string | null>(null);
const [selectedDate, setSelectedDate] = useState<string | null>(null);
const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
const [selectedVirality, setSelectedVirality] = useState<string | null>(null);
const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

// Badge rendering pattern
<img 
  src={selectedSort ? badgeLikesActive : badgeLikes}
  alt=">лайков"
  style={{ position: 'absolute', left: '407px', top: '406px', width: '186px', height: '79px' }}
/>
```

### 3. Like Toggle System
```typescript
// State
const [likedCards, setLikedCards] = useState<Set<number>>(new Set());
// LabaFavoritesScreen: new Set([1, 2, 3, 4]) - все красные

// Toggle logic
<div onClick={() => {
  setLikedCards(prev => {
    const newSet = new Set(prev);
    if (newSet.has(1)) newSet.delete(1);
    else newSet.add(1);
    return newSet;
  });
}}>
  <svg>
    <path 
      stroke={likedCards.has(1) ? '#FF0000' : 'white'} 
      fill={likedCards.has(1) ? '#FF0000' : 'none'} 
    />
  </svg>
</div>
```

### 4. Popup Messages
```typescript
const handleFilterClick = (filterType: string) => {
  let message = '';
  
  switch(filterType) {
    case 'date':
      message = 'дата публикации\n\nпоследние 7 дней\nпоследние 14 дней\n...';
      break;
    case 'language':
      message = 'язык\n\nрусский\nанглийский\nиспанский\n...';
      break;
    // ... etc
  }
  
  window.Telegram.WebApp.showPopup({ message });
}
```

---

## 📐 Координаты из Figma (LabaMainScreen)

### Filter Buttons Row 1
| Element | Node ID | Position | Size |
|---------|---------|----------|------|
| вернуть | 146:711 | 99, 327 | 247x79 |
| сортировка | 163:643 | 346, 327 | 247x79 |
| дата | 146:717 | 593, 327 | 247x79 |
| язык | 146:719 | 840, 327 | 247x79 |

### Filter Buttons Row 2
| Element | Node ID | Position | Size |
|---------|---------|----------|------|
| виральность | 163:640 | 220, 485 | 247x79 |
| аккаунт | 146:721 | 464, 485 | 247x79 |
| формат | 146:723 | 711, 485 | 247x79 |

### Filter Badges Row 2
| Element | Node ID | Position | Size |
|---------|---------|----------|------|
| лайки | 7:957 | 407, 406 | 186x79 |
| таймслот | 164:646 | 654, 406 | 186x79 |
| русский | 164:660 | 901, 406 | 186x79 |

### Filter Badges Row 3
| Element | Position | Size |
|---------|----------|------|
| баллы | 278, 564 | 186x79 |
| аккаунт | 516, 564 | 186x79 |
| рилс | 754, 564 | 186x79 |

### Navigation Elements (LabaSearchScreen)
| Element | Node ID | Position | Size |
|---------|---------|----------|------|
| скролл перемещения | 449:1006 | 301, 1879 | 131x131 |
| сайдбар | - | 241, 1875 | 688x139 |

---

## 🛠️ Tech Stack

- **React 18** + TypeScript
- **Vite** (build tool)
- **React Router v6** (navigation)
- **Telegram WebApp SDK** (@twa-dev/sdk)
- **Inline styles** (no Tailwind in components)

---

## 📝 Git History (Recent)

### Commit 3b88946 (HEAD)
- docs: update VERIFICATION_TABLE with scroll indicator fixes

### Commit e3be155
- fix: render scroll indicator BEFORE sidebar so it appears under icons
- **КРИТИЧНО:** DOM order определяет layering

### Commit b4acc31
- feat: add draggable scroll indicator for sidebar navigation
- Magnetic snap with 50px threshold
- Touch + mouse support

### Commit f73325e
- fix: add favorites navigation button to LabaSearchScreen sidebar

### Commit 37483cd
- feat: add LabaFavoritesScreen with all hearts red by default

### Commit f377eeb
- feat: update filter popup texts to match Figma design

### Commit 38a97d9
- fix: swap inactive and active badge/button PNGs
- Default: неактив, Active: regular

### Commit cfaab8f
- fix: update filter button and badge positions to exact Figma coordinates

---

## 🎯 Правила работы с экранами

1. **Экономия токенов** - максимум 2-3 промпта, параллельные операции
2. **Самопроверка по пикселям** - координаты из Figma metadata
3. **Скриншоты** - после каждого изменения сравнивать
4. **Метаданные Figma** - источник истины для координат
5. **PNG проверка** - реальные размеры через `file`, objectFit: 'contain'
6. **Не трогать** - работающие экраны и компоненты

---

## ⚠️ Известные проблемы

### LabaSearchScreen - Scroll Indicator
- ❌ Скролл показывается ПОВЕРХ иконок вместо ПОД (нужна доработка)
- Возможное решение: проверить порядок рендеринга и pointerEvents

---

## 📝 Последние изменения

### 20 января 2026, 23:35
**Коммит f0f8e55** - Унификация фона точки на ВСЕХ экранах
- ✅ Заменён элемент "фон точки" на всех 31 экранах (кроме SplashScreen)
- ✅ Использован ТОЧНЫЙ формат из SplashScreen:
  ```tsx
  <div style={{
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${bgPattern})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'repeat',
  }} />
  ```
- ✅ Обновлены экраны:
  - Onboarding: Welcome, TourVideo, DemoAccess, Pricing, MainDashboard (Free/Premium)
  - Промпт/Цех: AboutPrompt, PromptFirst, PromptCard
  - Академия: AboutAcademy, CoursesAll, CourseSystem/Art/Prompting/Automation, LessonVideo, LessonMaterials
  - Полигон: AboutPoligon, ArticlesAll, Article
  - Лаба: AboutLaba, Loading, Search, SearchAccount, NoTracked, Main, Favorites, Tracked, Analysis
  - Metacoins: MetacoinsScreen
  - Legal: PrivacyPolicy, MarketingConsent

---

**Файл сгенерирован:** 20 января 2026, 20:30
**Обновлён:** 20 января 2026, 23:35
**Последний коммит:** f0f8e55
