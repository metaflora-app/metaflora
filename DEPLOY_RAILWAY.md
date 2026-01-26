# 🚀 Деплой на Railway - Быстрая инструкция

## Предварительные требования:
✅ Railway CLI уже установлен (`@railway/cli` в devDependencies)
✅ Procfile готов (`npm run preview`)
✅ vite.config.ts настроен для Railway

---

## 📦 Шаг 1: Логин в Railway

```bash
cd /Users/user/.cursor/worktrees/_________/lct
railway login
```

Откроется браузер для авторизации через GitHub/Google/Email.

---

## 🎯 Шаг 2: Инициализация проекта

```bash
# Создать новый проект Railway
railway init

# Выбрать:
# - Create new project
# - Ввести название: metaflora-miniapp (или любое другое)
```

---

## 🚀 Шаг 3: Деплой

```bash
# Задеплоить проект
railway up

# Процесс:
# 1. Загрузка файлов
# 2. npm install
# 3. npm run build
# 4. npm run preview (из Procfile)
```

---

## 🌐 Шаг 4: Получить публичный домен

```bash
# Сгенерировать домен
railway domain

# Вы получите URL вида:
# https://metaflora-miniapp.up.railway.app
```

---

## 🔧 Шаг 5: Добавить переменные окружения (если нужно)

```bash
# Добавить переменные через CLI
railway variables set SUPABASE_URL=your_url
railway variables set SUPABASE_ANON_KEY=your_key

# Или через веб-интерфейс:
railway open
# Settings → Variables
```

---

## 📊 Полезные команды:

```bash
# Открыть проект в браузере
railway open

# Посмотреть логи
railway logs

# Посмотреть статус
railway status

# Пересобрать и задеплоить
railway up

# Удалить проект
railway delete
```

---

## 🔗 Связать с существующим проектом Railway:

Если проект уже создан на Railway:

```bash
# Связать локальную папку с проектом
railway link

# Выбрать проект из списка
```

---

## ⚡ Автоматический деплой через Git:

### Вариант 1: Через Railway Dashboard

1. Открыть https://railway.app
2. New Project → Deploy from GitHub repo
3. Выбрать репозиторий
4. Railway автоматически определит Vite проект
5. Добавить переменные окружения (если нужно)
6. Deploy!

### Вариант 2: Через CLI с Git

```bash
# Убедиться, что есть git репозиторий
git status

# Закоммитить изменения
git add .
git commit -m "Ready for Railway deploy"

# Задеплоить
railway up
```

---

## 🎯 Что происходит при деплое:

1. **Build:** `npm run build` → создается папка `dist/`
2. **Start:** `npm run preview` → запускается Vite preview server на порту из `process.env.PORT`
3. **Railway** автоматически:
   - Устанавливает зависимости
   - Собирает проект
   - Запускает preview server
   - Генерирует HTTPS домен

---

## 🔒 Настройка кастомного домена (опционально):

```bash
# Добавить свой домен
railway domain add yourdomain.com

# Настроить DNS:
# CNAME: yourdomain.com → your-app.up.railway.app
```

---

## 📝 Проверка перед деплоем:

```bash
# Локальная сборка
npm run build

# Локальный preview
npm run preview

# Открыть http://localhost:4173 (или PORT из env)
```

---

## ⚠️ Важные моменты:

1. **PORT:** Railway автоматически устанавливает переменную `PORT`, Vite использует её в preview mode
2. **Allowed Hosts:** В `vite.config.ts` уже настроены `.railway.app` домены
3. **Build Output:** Папка `dist/` создается при сборке (не коммитить в git!)
4. **Environment Variables:** Добавить через Railway Dashboard или CLI

---

## 🎉 Готово!

После деплоя вы получите:
- ✅ Публичный HTTPS домен
- ✅ Автоматические SSL сертификаты
- ✅ CDN для статики
- ✅ Логи и мониторинг
- ✅ Автоматические пересборки при push в git (если настроен GitHub)

---

## 🔗 Полезные ссылки:

- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- Vite Docs: https://vitejs.dev/guide/build.html
