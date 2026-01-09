# МЕТАФЛОРА* - Telegram Mini App

AI-обучение прямо в Telegram: академия, лаба, цех и другие сервисы.

## 🚀 Deployment

**Production URL:** https://web-production-fc84.up.railway.app

**Telegram Bot:** t.me/metaflora_bot/app

**Status:** ✅ Live (deployed 2026-01-09)

---

## 📱 Screens (34 total)

### Onboarding (6):
- Splash screen (auto-redirect)
- Welcome screen
- Tour video
- Demo access info
- Pricing plans
- Main dashboards (free/premium)

### Промпт/Цех (2):
- About prompt (intro video)
- Prompt catalog with filters
- Prompt card detail

### Академия (8):
- About academy (intro video)
- All courses library
- 4 course screens (система, искусство, промптинг, автоматизация)
- Lesson video player
- Lesson materials

### Полигон (3):
- About poligon (intro video)
- Articles catalog with search
- Article detail (scrollable)

### Лаба (7):
- About laba (intro video)
- Main feed (posts grid)
- Search screen
- Favorites feed
- Tracked accounts list
- Content analysis (collapsed/expanded)

### Legal (2):
- Privacy policy
- Marketing consent

---

## 🛠️ Tech Stack

- **React 18** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **React Router v6** (navigation)
- **Telegram WebApp SDK** (@twa-dev/sdk)

---

## 📦 Features

- ✅ Pixel-perfect Figma implementation (1180x2550px)
- ✅ Responsive viewport scaling
- ✅ Full navigation with React Router
- ✅ First-time intro screens (localStorage)
- ✅ UI state management (filters, tabs, selections)
- ✅ Telegram integration (external links, haptic feedback)
- ✅ Copy-to-clipboard for prompts
- ✅ Payment placeholders (redirect to @mishchenko_is)
- ✅ File download placeholders (Telegram bot integration pending)

---

## 🚀 Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📐 Design Source

All screens generated from Figma using MCP Talk-to-Figma plugin.

**Figma Page:** Page 1 (47 frames)  
**Used:** 36 main screens (1180x2550px)  
**Skipped:** UI components, system elements (iOS Status Bar, Home Indicator)

---

## 🔐 External Links

- **Support:** @mishchenko_is
- **Socials:** @mishchenko_is
- **Legal:** Privacy Policy, Marketing Consent (in-app)

---

## 📝 Navigation Map

See `NAVIGATION.md` for full navigation flow and button actions.

---

## 🎯 Next Steps

1. Test in Telegram WebView (iOS/Android)
2. Connect PostgreSQL for user data
3. Integrate Telegram Bot API for payments
4. Add backend for AI features (laba analysis)
5. Implement real file downloads via bot
6. Add analytics tracking

---

## 📄 License

© 2026 МЕТАФЛОРА. Все права защищены.
