# Процесс воссоздания экранов из Figma

## 🎯 ОСНОВНЫЕ ПРАВИЛА РАБОТЫ С ЭКРАНАМИ

### 1️⃣ ЖЕСТКАЯ ЭКОНОМИЯ ТОКЕНОВ
- **Максимум 2-3 промпта от юзера** на одну задачу
- Не задавать уточняющие вопросы - действовать по метаданным Figma
- Минимальные объяснения, максимум - код и результаты
- Параллельные операции в одном вызове (чтение, поиск, изменение одновременно)

### 2️⃣ САМОПРОВЕРКА ПО ПИКСЕЛЯМ НА КАЖДОМ ШАГЕ
- **ВСЕ координаты и размеры из Figma metadata** (`get_metadata`)
- Вычислять абсолютные позиции, не использовать `calc()` и `transform` без необходимости
- Сравнивать каждый элемент: x, y, width, height из Figma vs код
- **Проверять реальные размеры файлов** (PNG, шрифты) - они могут отличаться от Figma контейнеров
- Использовать `objectFit: 'contain'` если размеры PNG не совпадают с контейнером

### 3️⃣ ПОСТОЯННЫЕ СКРИНШОТЫ И СРАВНЕНИЕ
- После каждого изменения: скриншот из Figma + скриншот с деплоя
- Визуально сравнивать позиции, размеры, отступы
- Если отличается - смотреть координаты, не угадывать

### 4️⃣ ЧТО ТРОГАТЬ И ЧТО НЕ ТРОГАТЬ
- **ТОЛЬКО обведённые элементы** или указанные элементы
- **ОСТАЛЬНЫЕ ЭКРАНЫ И КОМПОНЕНТЫ НЕ ТРОГАТЬ** - работает, не ломать
- Если юзер говорит "остальное не трогать" - буквально имеет в виду остальное

### 5️⃣ МЕТАДАННЫЕ FIGMA - ИСТОЧНИК ИСТИНЫ
- Всегда получать metadata через `get_metadata` для точных координат
- Взять все элементы: x, y, width, height, parent, name
- Игнорировать дизайн-контекст с Tailwind - он для генерации, не для точности
- Проверять parent контейнеры - координаты могут быть относительные

### 6️⃣ PNG КНОПКИ И ИЗОБРАЖЕНИЯ
- Проверять реальные размеры файла через `file` команду
- Использовать правильные размеры при отображении
- Если PNG больше контейнера - использовать `objectFit: 'contain'`
- Копировать PNG с рабочего стола: `/Users/user/Desktop/`

## 🎨 АНИМАЦИИ В ПРОЕКТЕ (обновлено 2026-01-21)

### Глобальные анимации (src/index.css):

#### 1. **Blur Wave Animation** - blur 42-52px
```css
.blur-wave {
  animation: blurWave 8s ease-in-out infinite;
}
```
- Применяется на: все элементы с `backdropFilter: 'blur(50px)'`
- Оптимизировано для батареи: статичный blur 47px
- Используется на всех экранах для blur-контейнеров

#### 2. **Button/Badge Inner Glow** - brightness 1-1.35
```css
.button-inner-glow {
  animation: buttonInnerGlow 5s ease-in-out infinite;
}
```
- Применяется на: PNG кнопки с градиентами, плашки "демо", "новое"
- Используется на всех экранах
- Текст поверх кнопок остается белым

#### 3. **Card Pulse Animation** - scale 1-1.03
```css
.card-pulse-1 / .card-pulse-2
```
- Применяется на: карточки тарифов в PricingScreen и MetacoinsScreen
- Попеременная пульсация (задержка 1.5s между карточками)
- Используется только до выбора карточки

#### 4. **Card Selected** - lift effect
```css
.card-selected {
  transform: translateY(-20px);
}
```
- Применяется на: выбранные карточки в PricingScreen и MetacoinsScreen
- Поднимает карточку вверх на 20px

#### 5. **Carousel Crossfade Transitions** - smooth image fade
```css
.carousel-image {
  transition: opacity 1.2s ease-in-out;
  animation: carouselFadeIn 1.2s ease-in-out;
}
```
- Применяется на: WelcomeScreen карусель
- Очень плавный crossfade переход между изображениями (1.2s)
- Циклическая ротация: изображения меняются местами
- Все 3 карточки видны одновременно
- Центральная карточка = активный слайд
- Переключение только по клику на карточку или точку (без автоматики)

#### 5. **Carousel Crossfade Transitions** - smooth image fade
```css
.carousel-image
```
- Применяется на: WelcomeScreen карусель
- Плавный crossfade переход между изображениями (0.8s)
- Циклическая ротация: изображения меняются местами
- Все 3 карточки видны одновременно
- Центральная карточка = активный слайд

### Экраны с анимациями:

**Все 32 экрана:**
- ✅ Blur wave на всех backdrop-filter элементах
- ✅ Button glow на всех цветных кнопках и плашках

**PricingScreen:**
- ✅ Попеременная пульсация 2 карточек тарифов
- ✅ Подъем выбранной карточки

**MetacoinsScreen:**
- ✅ Попеременная пульсация 2 карточек метакоинов
- ✅ Подъем выбранной карточки

**WelcomeScreen:**
- ✅ Автоматическая карусель (4 секунды) с циклической ротацией
- ✅ Плавный crossfade переход (0.8s) между изображениями
- ✅ Динамическая пагинация (активная точка 63px белая, неактивные 17px серые)
- ✅ Центральная карточка = активный слайд
- ✅ Все 3 карточки видны одновременно, изображения циклически меняются

---

## 📋 Правило воссоздания (через /mcp-tailwind-css)

**Ссылка на фрейм → Скрин через MCP → Tailwind CSS от юзера → Фиксация всех элементов → Апрув от юзера → Деплой**

---

## 🎯 Прогресс: 33/33 экранов ЗАВЕРШЕНО! (обновлено 2026-01-21)

### ✅ Готовые экраны:

1. **Нулевой экран (splash)** - `/splash` 
   - Фрейм: `7:71`
   - Статус: ✅ Задеплоен на Railway
   - Анимации: blur-wave на всех blur элементах

2. **Экран приветствия (welcome)** - `/welcome`
   - Фрейм: `7:2727`
   - Статус: ✅ Задеплоен на Railway
   - Анимации:
     - Карусель с циклической ротацией (БЕЗ автоматики)
     - Очень плавный crossfade переход между изображениями (1.2s)
     - Все 3 карточки видны одновременно
     - Центральная карточка = активный слайд
     - Клик на карточку или точку переключает слайд
     - Динамическая пагинация (активная точка длинная и белая)
     - Button glow на кнопках
     - Blur wave на соцсетях

3. **Экран с экскурсией (tour-video)** - `/tour-video`
   - Фрейм: `7:99`
   - Статус: ✅ Задеплоен на Railway
   - Анимации:
     - Blur wave на видео блоке, кнопках плей/пауза/развернуть
     - Button glow на кнопке "попробовать бесплатно"

4. **Экран "что входит в демо" (demo-access)** - `/demo-access`
   - Фрейм: `7:2785`
   - Статус: ✅ Задеплоен на Railway
   - Анимации:
     - Blur wave на кнопке "продолжить" и соцсетях
     - Button glow на кнопке "оплатить полный доступ"

5. **Экран цены (pricing)** - `/pricing`
   - Фрейм: `7:2548`
   - Статус: ✅ Задеплоен на Railway
   - Анимации:
     - Попеременная пульсация карточек (scale 1-1.03)
     - Подъем выбранной карточки (translateY -20px)
     - Button glow на кнопке "оплатить"
     - Blur wave на всех blur элементах

6. **Экран политика конфиденциальности (privacy-policy)** - `/privacy-policy`
   - Фрейм: `7:2854`
   - Статус: ✅ Задеплоен на Railway
   - Анимации: blur-wave, button-glow

7. **Экран рекламная и информационная рассылка (marketing-consent)** - `/marketing-consent`
   - Фрейм: `24:459`
   - Статус: ✅ Задеплоен на Railway
   - Анимации: blur-wave, button-glow

8. **Главный экран без подписки (main-dashboard-free)** - `/main-dashboard-free`
   - Фрейм: `7:162`
   - Статус: ✅ Задеплоен на Railway
   - Анимации:
     - Blur wave на правой карточке, белой подложке, соцсетях
     - Button glow на кнопках "открыть" и "оплатить"
     - Button glow на плашке "демо"

9. **О МЕТАФЛОРА* цех (about-prompt)** - `/about-prompt`
   - Фрейм: `7:405`
   - Статус: ✅ Задеплоен на Railway
   - Анимации: blur-wave, button-glow

10. **Главный экран с подпиской (main-dashboard-premium)** - `/main-dashboard-premium`
    - Фрейм: `7:270`
    - Статус: ✅ Задеплоен на Railway
    - Анимации:
      - Blur wave на всех 5 карточках сервисов
      - Button glow на кнопках "открыть" и "пополнить"
      - Button glow на плашке "новое"

11. **О МЕТАФЛОРА* академия (about-academy)** - `/about-academy`
    - Фрейм: `27:365`
    - Статус: ✅ Задеплоен на Railway
    - Анимации: blur-wave, button-glow

12. **О МЕТАФЛОРА* лаба (about-laba)** - `/about-laba`
    - Фрейм: `27:410`
    - Статус: ✅ Задеплоен на Railway
    - Анимации: blur-wave, button-glow

13. **Все курсы в академии (academy-courses-all)** - `/academy-courses-all`
    - Фрейм: `7:2213`
    - Статус: ✅ Задеплоен на Railway
    - Анимации:
      - Blur wave на всех 4 карточках курсов
      - Button glow на кнопках "изучить"

14. **Видео урока в академии (academy-lesson-video)** - `/academy-lesson-video`
    - Фрейм: `27:498`
    - Статус: ✅ Задеплоен на Railway
    - Анимации: blur-wave, button-glow

15. **Внутри курса в академии (academy-course-system)** - `/academy-course-system`
    - Фрейм: `7:2419`
    - Статус: ✅ Задеплоен на Railway
    - Анимации: blur-wave на всех 8 карточках уроков

16. **Материалы урока (academy-lesson-materials)** - `/academy-lesson-materials`
    - Фрейм: `7:2022`
    - Статус: ✅ Задеплоен на Railway
    - Анимации: blur-wave, button-glow на плашках

17. **Карточка промпта (prompt-card)** - `/prompt-card`
    - Фрейм: `7:1879`
    - Статус: ✅ Задеплоен на Railway
    - Анимации: blur-wave, button-glow

18. **О МЕТАФЛОРА* полигон (about-poligon)** - `/about-poligon`
    - Фрейм: `27:453`
    - Статус: ✅ Задеплоен на Railway
    - Анимации: blur-wave, button-glow

19. **Как выглядит статья (article)** - `/article`
    - Фрейм: `34:904`
    - Статус: ✅ Задеплоен на Railway
    - Анимации: blur-wave, button-glow

20. **Первый экран промпт (prompt-first)** - `/prompt-first`
   - Фрейм: `7:1608`
   - Статус: ✅ Задеплоен на Railway
   - Анимации:
     - Blur wave на фрейме карточек
     - Button glow на кнопках фильтров
     - Button glow на плашках "новое"

21. **Экран поиска лаба (laba-search)** - `/laba-search`
   - Фрейм: `7:665`
   - Статус: ✅ Задеплоен на Railway
   - Анимации: blur-wave, button-glow

22. **Еще нет отслеживаемых (laba-no-tracked)** - `/laba-no-tracked`
    - Фрейм: `7:1330`
    - Статус: ✅ Задеплоен на Railway
    - Анимации: blur-wave, button-glow

23. **Метакоины (metacoins)** - `/metacoins`
    - Фрейм: `7:2652`
    - Статус: ✅ Задеплоен на Railway
    - Анимации:
      - Попеременная пульсация карточек (scale 1-1.03)
      - Подъем выбранной карточки (translateY -20px)
      - Button glow на кнопке "купить метакоины"

24. **Экран загрузки лаба (laba-loading)** - `/laba-loading`
    - Статус: ✅ Задеплоен на Railway
    - Анимации: blur-wave, button-glow

25. **Главный экран лаба (laba-main)** - `/laba-main`
    - Фрейм: `7:908`
    - Статус: ✅ Задеплоен на Railway
    - Анимации:
      - Blur wave на фрейме карточек
      - Button glow на кнопках фильтров и плашках
      - Button glow на плашках "новое" и временных плашках

26. **Экран отслеживаемые лаба (laba-tracked)** - `/laba-tracked`
   - Фрейм: `7:1138`
   - Статус: ✅ Задеплоен на Railway
   - Анимации:
     - Blur wave на карточках
     - Button glow на плашках "новое" и временных плашках

27. **ИИ-анализ контента (laba-analysis)** - `/laba-analysis`
    - Фрейм: `7:719`
    - Статус: ✅ Задеплоен на Railway (ИНТЕРАКТИВНЫЙ)
    - Анимации: blur-wave, button-glow

28. **Избранное лаба (laba-favorites)** - `/laba-favorites`
    - Статус: ✅ Задеплоен на Railway
    - Анимации:
      - Blur wave на карточках
      - Button glow на плашках "новое" и временных плашках

29. **Все статьи в полигоне (poligon-articles-all)** - `/poligon-articles-all`
    - Статус: ✅ Задеплоен на Railway
    - Анимации:
      - Blur wave на всех 4 карточках статей
      - Button glow на кнопках "читать"

30. **Курс искусство (academy-course-art)** - `/academy-course-art`
    - Статус: ✅ Задеплоен на Railway
    - Анимации: blur-wave на карточках уроков

31. **Курс промптинг (academy-course-prompting)** - `/academy-course-prompting`
    - Статус: ✅ Задеплоен на Railway
    - Анимации: blur-wave на карточках уроков

32. **Курс автоматизация (academy-course-automation)** - `/academy-course-automation`
    - Статус: ✅ Задеплоен на Railway
    - Анимации: blur-wave на карточках уроков

33. **Внутри курса в академии демо (academy-course-demo)** - `/academy-course-demo`
    - Фрейм: `633:757`
    - Статус: ✅ Задеплоен на Railway
    - Элементы:
      - Дубликат academy-course-system с изменениями
      - Заголовок: "уроки курса «демо»"
      - 4 карточки уроков (вместо 8)
      - Лого ведет на /main-dashboard-free
    - Навигация: main-dashboard-free (кнопка "открыть") → academy-course-demo
    - Анимации: blur-wave на карточках уроков

---

## 🔧 Технические детали анимаций:

### Оптимизация батареи:
- Blur wave: 8s duration (медленно)
- Button glow: 5s duration
- Статичный blur 47px (не анимируется для экономии GPU)
- `backface-visibility: hidden` на всех анимациях

### Предотвращение мерцания:
- Использование `opacity` вместо `scale` где возможно
- `backface-visibility: hidden` для устранения edge flickering
- `will-change` hints только где необходимо
- Минимальные диапазоны анимации (blur 42-52px, brightness 1-1.35)

### Интерактивность:
- Карусель WelcomeScreen: автопрокрутка + свайпы
- Pricing/Metacoins: выбор карточки с подъемом
- Динамическая пагинация на WelcomeScreen

---

## ✅ ЗАВЕРШЕННЫЕ ЭКРАНЫ - ПОЛНЫЙ СПИСОК (33/33):

1. ✅ splash
2. ✅ welcome (+ карусель с анимацией)
3. ✅ tour-video
4. ✅ demo-access
5. ✅ pricing (+ анимация выбора карточек)
6. ✅ privacy-policy
7. ✅ marketing-consent
8. ✅ main-dashboard-free
9. ✅ main-dashboard-premium
10. ✅ about-prompt (цех)
11. ✅ about-academy
12. ✅ about-laba
13. ✅ academy-courses-all
14. ✅ academy-lesson-video
15. ✅ academy-course-system
16. ✅ academy-course-art
17. ✅ academy-course-prompting
18. ✅ academy-course-automation
19. ✅ academy-lesson-materials
20. ✅ prompt-card
21. ✅ prompt-first
22. ✅ about-poligon
23. ✅ article
24. ✅ poligon-articles-all
25. ✅ laba-search
26. ✅ laba-no-tracked
27. ✅ laba-search-account
28. ✅ metacoins (+ анимация выбора карточек)
29. ✅ laba-loading
30. ✅ laba-main
31. ✅ laba-tracked
32. ✅ laba-favorites
33. ✅ laba-analysis (с интерактивностью)
34. ✅ academy-course-demo (демо версия с 4 уроками)

---

## 🎉 ВСЕ ЭКРАНЫ ВОССОЗДАНЫ С АНИМАЦИЯМИ!

Платформа МЕТАФЛОРА полностью готова к работе с оптимизированными анимациями!

---

## 📝 ПОСЛЕДНИЕ ОБНОВЛЕНИЯ (2026-01-21):

### WelcomeScreen карусель:
- ✅ Убрана автоматическая прокрутка (только ручное управление)
- ✅ Увеличена плавность crossfade до 1.2s
- ✅ Клик на карточку переключает её в центр
- ✅ Клик на точки пагинации работает
- ✅ Циклическая ротация изображений
- ✅ Убрано зеркалирование правой карточки

### Фоны на всех экранах:
- ✅ Все 33 экрана используют точный элемент фона из SplashScreen
- ✅ Формат: `inset: 0`, `backgroundSize: 'cover'`, `backgroundPosition: 'center'`, `backgroundRepeat: 'repeat'`

### Новый экран:
- ✅ academy-course-demo создан (4 урока, демо версия)
- ✅ Переход с MainDashboardFreeScreen (кнопка "открыть")
- ✅ Убрана невидимая кнопка, блокировавшая навигацию

### Исправления навигации:
- ✅ PromptFirstScreen: лого теперь ведет на /main-dashboard-premium

---

## 📝 ОБНОВЛЕНИЯ (2026-01-21, вечер):

### Унификация позиций кнопок "открыть":
- ✅ Все кнопки "открыть" на dashboard экранах: **x=101, y=85, 247×79px**
- ✅ Источник: Figma metadata nodes 354:654, 356:731-783
- ✅ Обновлено 6 кнопок в MainDashboardFree и MainDashboardPremium
- ✅ Коммит: f2040a9

### Обновления UI элементов:
- ✅ MainDashboardFreeScreen: удалена кнопка "назад" (exitArrow)
- ✅ LabaSearchAccountScreen: обновлён header на PNG кнопку из MetacoinsScreen
- ✅ Координаты supportButton: 829px, 97px, 205×78px
- ✅ Коммиты: a79a38b, bd89a0b

---

## 📝 ОБНОВЛЕНИЯ (2026-01-21, 22:10):

### UI элементы обновлены:
- ✅ LabaMainScreen & LabaFavoritesScreen: добавлена плашка "начать поиск" с button-inner-glow
- ✅ LabaAnalysisScreen: видимые PNG кнопки "начать анализ" и "создать сценарий" (поменьше версии)
- ✅ LabaNoTrackedScreen: blur overlay заменён на PNG "окошко отслеживание" + невидимая кнопка
- ✅ MetacoinsScreen: карточки заменены на "5000 метакоинов" и "25 000 метакоинов"
- ✅ LabaMainScreen: все 4 карточки с видимыми кнопками "анализ" (PNG)
- ✅ Коммиты: 3e35c58, 3400338

### Оптимизация производительности:
- ✅ Splash screen 8 секунд - грузит ВСЕ изображения перед переходом
- ✅ assetPreloader: принудительная загрузка всех 315+ PNG при старте
- ✅ screenChainPreloader: проверка загрузки цепочек экранов перед навигацией
- ✅ MainDashboardPremiumScreen: кнопки "открыть" ждут загрузки всей цепочки экранов
- ✅ GPU ускорение: translate3d, backface-visibility, will-change на всех анимациях
- ✅ Коммиты: a4fe684, d017681

### Цепочки экранов:
- **Academy**: about-academy → courses → lessons
- **Laba**: about-laba → laba-main → laba-analysis → laba-no-tracked → laba-favorites
- **Tsekh**: about-prompt → prompt-first → prompt-card
- **Poligon**: about-poligon → articles → article
