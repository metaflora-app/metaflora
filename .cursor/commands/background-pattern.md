## Фон точки (Background Pattern) - Универсальное правило

**Использовать на всех экранах:**

```tsx
// Import
import bgPattern from '../../assets/figma-welcome/pattern.png';

// Background container (full screen)
<div
  style={{
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${bgPattern})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'repeat',
  }}
/>
```

**Путь к изображению:** `src/assets/figma-welcome/pattern.png`

**Применять на всех экранах где есть "фон точки" в Figma**
