const FAVORITES_KEY = 'metaflora_prompt_favorites';
const RECENTS_KEY = 'metaflora_prompt_recent_views';
const MAX_RECENT_IDS = 20;

function readIds(key: string): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch (error) {
    console.error(`Failed to write ${key}:`, error);
  }
}

export function getPromptFavoriteIds(): string[] {
  return readIds(FAVORITES_KEY);
}

export function isPromptFavorite(promptId: string): boolean {
  return getPromptFavoriteIds().includes(promptId);
}

export function togglePromptFavorite(promptId: string): boolean {
  const currentIds = getPromptFavoriteIds();
  const nextIds = currentIds.includes(promptId)
    ? currentIds.filter((id) => id !== promptId)
    : [...currentIds, promptId];

  writeIds(FAVORITES_KEY, nextIds);
  return nextIds.includes(promptId);
}

export function getRecentPromptIds(): string[] {
  return readIds(RECENTS_KEY);
}

export function markPromptViewed(promptId: string) {
  const currentIds = getRecentPromptIds().filter((id) => id !== promptId);
  writeIds(RECENTS_KEY, [promptId, ...currentIds].slice(0, MAX_RECENT_IDS));
}
