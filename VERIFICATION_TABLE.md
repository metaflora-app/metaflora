# LabaMainScreen - Verification Table

## Latest Updates (Jan 20, 2026)

### Commit f377eeb - Filter Popup Texts
✅ Updated all filter popup messages to match Figma design
- Сортировка: >просмотров, <просмотров, >лайков, <лайков, >комментариев, <комментариев
- Дата: последние 7/14/30 дней, 6 месяцев, год
- Язык: русский, английский, испанский, турецкий, французский
- Виральность: 0-2, 3-5, 6-8, 9-10 баллов
- Размер аккаунта: 0-10k, 10k-100k, 100k-300k, 300k-1млн, больше 1млн

### Commit 38a97d9 - Inactive/Active PNG Swap
✅ Swapped inactive and active badge/button states
- Default: неактив versions (lighter/disabled look)
- Active: regular versions (highlighted when selected)
- 14 new inactive PNG files added

### Commit cfaab8f - Exact Figma Coordinates
✅ Updated positions to exact Figma metadata
- All buttons: 247x79px (was varied)
- Badge лайки: 407px (was 404px)
- Button формат: 711px (was 712px)

## PNG Assets Dimensions Check

### Filter Badges (плашки) - Row 2
| Element | File Size | Display Size (code) | Scale | Position (x, y) | Status |
|---------|-----------|---------------------|-------|-----------------|--------|
| плашка лайки | 558x237 | 186x79 | @3x ✓ | 404, 406 | ✓ Active toggle added |
| плашка таймслот | 558x237 | 186x79 | @3x ✓ | 654, 406 | ✓ Active toggle added |
| плашка русский | 558x237 | 186x79 | @3x ✓ | 901, 406 | ✓ Active toggle added |

### Filter Badges (плашки) - Row 3
| Element | File Size | Display Size (code) | Scale | Position (x, y) | Status |
|---------|-----------|---------------------|-------|-----------------|--------|
| плашка баллы | 558x237 | 186x79 | @3x ✓ | 278, 564 | ✓ Active toggle added |
| плашка аккаунт | 558x237 | 186x79 | @3x ✓ | 516, 564 | ✓ Active toggle added |
| плашка рилс | 558x237 | 186x79 | @3x ✓ | calc(50% + 214px), 564 | ⚠️ Uses calc() |

### Filter Buttons - Row 1
| Element | File Size | Display Size (code) | Scale | Position (x, y) | Status |
|---------|-----------|---------------------|-------|-----------------|--------|
| кнопка вернуть | 247x80 | 186x79 | ~1.3x | 99, 327 | ✓ |
| кнопка сортировка | 247x80 | 216x79 | ~1.14x | 346, 327 | ✓ Active toggle |
| кнопка дата | 247x80 | 169x79 | ~1.46x | 593, 327 | ✓ Active toggle |
| кнопка язык | 247x80 | 186x79 | ~1.3x | 840, 327 | ✓ Active toggle |

### Filter Buttons - Row 2
| Element | File Size | Display Size (code) | Scale | Position (x, y) | Status |
|---------|-----------|---------------------|-------|-----------------|--------|
| кнопка виральность | 247x80 | 247x79 | ~1x | 220, 485 | ✓ Active toggle |
| кнопка аккаунт | 247x80 | 247x79 | ~1x | 464, 485 | ✓ Active toggle |
| кнопка формат | 247x80 | 247x79 | ~1x | 712, 485 | ✓ |

### Search Badge
| Element | File Size | Display Size (code) | Scale | Position (x, y) | Status |
|---------|-----------|---------------------|-------|-----------------|--------|
| плашка сколько стоит поиск | 390x216 | 130x72 | @3x ✓ | calc(50% + 373px), -2 | ⚠️ Uses calc() |

## Card Elements

### "новое" Badge
| Card | Position (x, y) | Size | Status |
|------|-----------------|------|--------|
| Card 1 | 269, 44 | 101x36 | ✓ PNG from assets |
| Card 2 | 269, 44 | 101x36 | ✓ PNG added |
| Card 3 | 269, 44 | 101x36 | ✓ PNG added |
| Card 4 | 269, 44 | 101x36 | ✓ PNG added |

### Like Toggle
| Card | Position (x, y) | Size | Interactive | Status |
|------|-----------------|------|-------------|--------|
| Card 1 | 42, 44 | 36x36 | ✓ Click toggle | ✓ Working |
| Card 2 | 42, 44 | 36x36 | ✓ Click toggle | ✓ Fixed |
| Card 3 | 42, 44 | 36x36 | ✓ Click toggle | ✓ Fixed |
| Card 4 | 42, 44 | 36x36 | ✓ Click toggle | ✓ Fixed |

## Issues to Fix

1. ⚠️ **плашка рилс** - uses `calc(50% + 214px)` instead of absolute pixels
2. ⚠️ **плашка сколько стоит поиск** - uses `calc(50% + 373px)` instead of absolute pixels

## Completed Tasks

✅ Like toggle on cards 2, 3, 4 - default unliked, click to red
✅ Copy 'новое' badge PNG from card 1 to cards 2, 3, 4
✅ Add active badge imports and conditional rendering
✅ All active badges now toggle based on filter state
