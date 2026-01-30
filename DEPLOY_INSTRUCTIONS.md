# 🚀 ИНСТРУКЦИИ ПО ДЕПЛОЮ МИНИ-АППА

## ✅ Подготовка завершена:
- ✅ Код написан и протестирован
- ✅ TypeScript проверка пройдена
- ✅ Коммит создан на ветке: `laba-automation-frontend`
- ✅ Все экраны обновлены и подключены к API

---

## 📝 ДЕПЛОЙ ЧЕРЕЗ MERGE

### Шаг 1: Перейдите в main worktree

```bash
cd /Users/user/.cursor/worktrees/_________/mqo
```

### Шаг 2: Проверьте что на main ветке

```bash
git branch
# Должно показать: * main
```

### Шаг 3: Смержите ветку с автоматизацией

```bash
git merge laba-automation-frontend --no-ff -m "merge: laba automation frontend"
```

### Шаг 4: Запуште на GitHub

**Через GitHub Desktop:**
1. Откройте GitHub Desktop
2. Выберите репозиторий `metaflora`
3. Нажмите **Push origin**

**Через VS Code:**
1. Откройте папку `/Users/user/.cursor/worktrees/_________/mqo` в VS Code
2. Source Control (Cmd+Shift+G)
3. Нажмите **Sync Changes** или **Push**

**Через терминал (если credentials работают):**
```bash
git push origin main
```

---

## 🔍 ПРОВЕРКА ДЕПЛОЯ

### После деплоя:

1. Откройте Telegram → @metaflora_bot
2. Запустите мини-апп
3. Перейдите в **лабу**
4. Проверьте:
   - ✅ Главный экран загружает топ reels (может быть пусто если cron не запустился)
   - ✅ Поиск работает (нажмите "начать поиск")
   - ✅ Анализ открывается
   - ✅ Отслеживание работает

---

## ⚠️ ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

### Reels не загружаются:
- Подождите 3 часа (cron обновит топ reels)
- ИЛИ вручную вызовите: `curl https://service-production-f0b1.up.railway.app/api/cron/update-top-reels`

### Ошибка при поиске:
- Проверьте что сервис задеплоен
- Проверьте что APIFY_API_TOKEN добавлен в Railway

### Ошибка при анализе:
- Проверьте что OPENAI_API_KEY добавлен в Railway
- Проверьте баланс OpenAI ($5-10)

### Ошибка при генерации:
- Проверьте что OPENROUTER_API_KEY добавлен в Railway
- Проверьте баланс OpenRouter ($5-10)

---

## 🎯 ГОТОВО!

После деплоя лаба будет полностью функциональна с реальным парсингом Instagram!
