const API_BASE_URL = "http://127.0.0.1:8000/api";

async function parseJsonResponse(response, fallback) {
  try {
    return await response.json();
  } catch {
    return fallback;
  }
}

export async function fetchNews() {
  try {
    const response = await fetch(`${API_BASE_URL}/news`);
    if (!response.ok) throw new Error("News API request failed");
    return await response.json();
  } catch (error) {
    console.error("無法取得新聞資料：", error);
    return [];
  }
}

export async function fetchWeather(region) {
  if (!region) return [];
  try {
    const response = await fetch(`${API_BASE_URL}/weather?region=${encodeURIComponent(region)}`);
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error("無法取得天氣資料：", error);
    return [];
  }
}

export async function fetchHoroscope(zodiac) {
  if (!zodiac) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/horoscope?zodiac=${encodeURIComponent(zodiac)}`);
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error("無法取得星座資料：", error);
    return null;
  }
}

export async function fetchSettings() {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      credentials: "include"
    });
    return response.ok ? await response.json() : { ai_news_summary: false };
  } catch (error) {
    console.error("無法取得個性化設定：", error);
    return { ai_news_summary: false };
  }
}

export async function updateAiSummarySetting(enabled) {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/ai-summary`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled })
    });
    if (!response.ok) throw new Error("Settings API request failed");
    return await response.json();
  } catch (error) {
    console.error("無法更新 AI 摘要設定：", error);
    return { ai_news_summary: !enabled };
  }
}

export async function fetchUserPrefs() {
  try {
    const response = await fetch(`${API_BASE_URL}/me/prefs`, {
      credentials: "include"
    });
    const data = await parseJsonResponse(response, { success: false });
    return data.success ? data.prefs : null;
  } catch (error) {
    console.error("無法取得使用者偏好：", error);
    return null;
  }
}

export async function updateUserPrefs(prefs) {
  try {
    const response = await fetch(`${API_BASE_URL}/me/prefs`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs)
    });
    const data = await parseJsonResponse(response, { success: false });
    return data.success ? data.prefs : null;
  } catch (error) {
    console.error("無法更新使用者偏好：", error);
    return null;
  }
}

export async function fetchUserBookmarks() {
  try {
    const response = await fetch(`${API_BASE_URL}/me/bookmarks`, {
      credentials: "include"
    });
    const data = await parseJsonResponse(response, { success: false, bookmarks: [] });
    return data.success ? data.bookmarks : [];
  } catch (error) {
    console.error("無法取得使用者收藏：", error);
    return [];
  }
}

export async function addBookmark(newsId) {
  try {
    const response = await fetch(`${API_BASE_URL}/me/bookmarks/${encodeURIComponent(newsId)}`, {
      method: "POST",
      credentials: "include"
    });
    return await parseJsonResponse(response, { success: false });
  } catch (error) {
    console.error("無法新增收藏：", error);
    return { success: false };
  }
}

export async function removeBookmark(newsId) {
  try {
    const response = await fetch(`${API_BASE_URL}/me/bookmarks/${encodeURIComponent(newsId)}`, {
      method: "DELETE",
      credentials: "include"
    });
    return await parseJsonResponse(response, { success: false });
  } catch (error) {
    console.error("無法移除收藏：", error);
    return { success: false };
  }
}
