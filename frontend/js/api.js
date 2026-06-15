const API_BASE_URL = "http://127.0.0.1:8000/api";

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
    const response = await fetch(`${API_BASE_URL}/settings`);
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
