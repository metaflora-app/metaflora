# Metaflora Redesign Handoff

## Scope Already Done
Перенесена и частично доведена группа первых экранов редизайна мини-аппа с опорой на Figma, ассеты из папки на рабочем столе и локальные правки по текстам/юридическим документам.

### Что уже изменено
- Подключены все начертания `Cygre` в `src/assets/fonts/` и `src/styles/fonts.css`
- В проект добавлен новый базовый фон `src/assets/figma-welcome/фон для эксперимента.png`
- Удалены лишние оверлеи старого фона из общего редизайн-layout для затронутых экранов
- Сделан `ScreenLayout.tsx` для общих частей (фон, лого, футер)
- Доделан `MainDashboardPremiumScreen.tsx` под Figma `2138:888`
- Возвращен `Kinescope` на `TourVideoScreen` и `AboutAcademyScreen`
- Добавлены/обновлены юрэкраны: `privacy-policy`, `marketing-consent`, `public-offer`
- Добавлен маршрут `/public-offer`
- Восстановлен отсутствующий ассет `src/assets/laba-main-buttons/плашка рилс.png`, который ломал production build

## Key Files Changed
- `src/components/ScreenLayout.tsx`
- `src/components/LegalDocumentScreen.tsx`
- `src/screens/splash/SplashScreen.tsx`
- `src/screens/welcome/WelcomeScreen.tsx`
- `src/screens/tour-video/TourVideoScreen.tsx`
- `src/screens/about-academy/AboutAcademyScreen.tsx`
- `src/screens/main-dashboard-free/MainDashboardFreeScreen.tsx`
- `src/screens/main-dashboard-premium/MainDashboardPremiumScreen.tsx`
- `src/screens/privacy-policy/PrivacyPolicyScreen.tsx`
- `src/screens/marketing-consent/MarketingConsentScreen.tsx`
- `src/screens/public-offer/PublicOfferScreen.tsx`
- `src/routes.tsx`

## Relevant Assets Sources
### Desktop assets folder
Основная папка ассетов редизайна:
`/Users/user/Desktop/ассеты после редизайна/`

Отсюда можно и нужно брать:
- кнопки
- видео
- фоновые PNG
- плашки
- иконки
- оверлеи

### Existing redesigned screens
Перед переносом следующих 6 экранов можно переиспользовать уже вставленные решения из:
- `src/screens/main-dashboard-premium/MainDashboardPremiumScreen.tsx`
- `src/screens/tour-video/TourVideoScreen.tsx`
- `src/screens/about-academy/AboutAcademyScreen.tsx`
- `src/components/ScreenLayout.tsx`
- `src/components/AboutVideoPlayer.tsx`

### Figma
Файл редизайна:
`https://www.figma.com/design/XyPNKbTs7qSAgbcJwF1Ae0/МЕТАФЛОРА-`

Важно:
- если пользователь дает конкретные node-id, нужно брать размеры, отступы, тексты и состав элементов именно из них
- если пользователь прямо пишет "скачай элемент из Figma", лучше скачивать ассет/изображение напрямую, а не реконструировать текст вручную, когда это возможно
- если пользователь требует Kinescope, не заменять его на локальный `<video>` без запроса

## Commits In This Thread
От старых к новым:
- `c66a35c` `feat(redesign): первые 6 экранов — шрифт Cygre, новые ассеты, видео, редизайн`
- `40b695f` `fix(redesign): пиксельная точность по Figma — футер, хедер, кружок, кнопки, фон`
- `f73893c` `fix(premium): пиксельная точность из Figma 2138:888 — карточки, кружок, кнопки, футер`
- `9eed620` `fix(ui): restore app build and align premium/tour/splash to figma`
- `c2ab3ef` `fix(ui): figma button alignment, academy kinescope, legal document content`
- `80e5d8f` `fix(ui): figma button alignment, academy kinescope, legal document content`

### Final fixes in this message
После handoff-файла добавлены еще две точечные правки:
- текст карточки `академия` возвращен по Figma `2138:911`
- текст в плашке `поддержка` выровнен строго через flex-центрирование

## Verified Status
Локально проверено:
- `npx tsc --noEmit`
- `npm run build`

Обе проверки проходят.

## What To Tell The Next Agent
Скопируй и отправь примерно такой текст в следующий чат:

```text
Продолжаем редизайн Metaflora mini-app.

Работай в `/Users/user/.cursor/worktrees/_________/sqb`.
После изменений нужно:
1. прогнать `npx tsc --noEmit`
2. прогнать `npm run build`
3. сделать коммит в `sqb`
4. скопировать измененные файлы в `/Users/user/.cursor/worktrees/_________/mqo`
5. снова прогнать проверки в `mqo`
6. закоммитить и запушить в `main`

Перед началом прочитай файл `REDESIGN_HANDOFF_NEXT_6.md`.

Важно:
- если я даю конкретные Figma node-id, бери размеры/позиции/тексты строго оттуда
- если я говорю скачать элементы из Figma, именно скачивай/импортируй их, а не реконструируй вручную, если это возможно
- можно и нужно брать ассеты из `/Users/user/Desktop/ассеты после редизайна/`
- можно и нужно переиспользовать ассеты и решения из уже редизайненных экранов (`main-dashboard-premium`, `tour-video`, `about-academy`, `ScreenLayout`)
- не трогай лишнее вне явно перечисленных экранов
- если возвращается Kinescope в макете, не заменяй его локальным video

Теперь перенеси следующие 6 экранов редизайна.
```

## Recommended Next 6 Screens
Следующим агентом логично делать следующую шестерку из ближайшего блока продукта:
- `/about-laba`
- `/about-prompt`
- `/about-poligon`
- `/demo-access`
- `/pricing`
- `/metacoins`

Причина:
- они визуально связаны с уже сделанными `tour-video`, `about-academy`, `main-dashboard-premium`
- там уже можно переиспользовать общий фон, футер, Kinescope-оверлей, glow/black pill-кнопки и часть ассетов
