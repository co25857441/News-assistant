export const STORAGE_KEYS = {
  ONBOARDED: "newsHelper_onboarded",
  PREFS: "newsHelper_prefs",
  FAVORITES: "newsHelper_favorites",
  FAVORITE_ITEMS: "newsHelper_favorite_items",
  READ_NEWS: "readNews"
};

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export const state = {
  currentView: "welcome",
  lastMainView: "home",
  currentDetailId: null,
  favoriteFilter: "全部",
  activeInterestFilter: "全部",
  searchQuery: "",
  favoriteSearchQuery: "",
  currentPage: 1,
  featuredIndex: 0,
  crawlerSettings: { ai_news_summary: false },
  tempPrefs: { interests: [], region: "", zodiac: "" },
  prefs: loadFromStorage(STORAGE_KEYS.PREFS, null),
  favorites: loadFromStorage(STORAGE_KEYS.FAVORITES, []),
  favoriteItems: loadFromStorage(STORAGE_KEYS.FAVORITE_ITEMS, []),
  readNews: loadFromStorage(STORAGE_KEYS.READ_NEWS, []),
  onboarded: loadFromStorage(STORAGE_KEYS.ONBOARDED, false),
  user: null,
  authRedirectAfterLogin: null
};

export function setUser(user) {
  state.user = user;
}

export function setAuthRedirectAfterLogin(view) {
  state.authRedirectAfterLogin = view;
}

export function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function setOnboarded(value) {
  state.onboarded = value;
  saveToStorage(STORAGE_KEYS.ONBOARDED, value);
}

export function setPrefs(prefs, { persist = !state.user } = {}) {
  state.prefs = prefs;
  if (persist) saveToStorage(STORAGE_KEYS.PREFS, prefs);
}

export function setFavorites(favorites, { persist = !state.user } = {}) {
  state.favorites = favorites;
  if (persist) saveToStorage(STORAGE_KEYS.FAVORITES, favorites);
}

export function setFavoriteItems(items, { persist = !state.user } = {}) {
  state.favoriteItems = items;
  if (persist) saveToStorage(STORAGE_KEYS.FAVORITE_ITEMS, items);
}

export function setReadNews(ids) {
  state.readNews = ids;
  saveToStorage(STORAGE_KEYS.READ_NEWS, ids);
}

export function setCrawlerSettings(settings) {
  state.crawlerSettings = {
    ...state.crawlerSettings,
    ...(settings || {})
  };
}
