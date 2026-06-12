//狀態管理、資料與設定

export const STORAGE_KEYS = { 
  ONBOARDED: "newsHelper_onboarded", 
  PREFS: "newsHelper_prefs", 
  FAVORITES: "newsHelper_favorites" 
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
  tempPrefs: { interests: [], region: "", zodiac: "" }, 
  prefs: loadFromStorage(STORAGE_KEYS.PREFS, null), 
  favorites: loadFromStorage(STORAGE_KEYS.FAVORITES, []), 
  onboarded: loadFromStorage(STORAGE_KEYS.ONBOARDED, false) 
};

export function saveToStorage(key, value) { 
  localStorage.setItem(key, JSON.stringify(value)); 
}

export function setOnboarded(value) { 
  state.onboarded = value; 
  saveToStorage(STORAGE_KEYS.ONBOARDED, value); 
}

export function setPrefs(prefs) { 
  state.prefs = prefs; 
  saveToStorage(STORAGE_KEYS.PREFS, prefs); 
}

export function setFavorites(favorites) { 
  state.favorites = favorites; 
  saveToStorage(STORAGE_KEYS.FAVORITES, favorites); 
}