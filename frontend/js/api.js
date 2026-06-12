//資料獲取與 API 

// backend FastAPI 預設的網址與 Port
const API_BASE_URL = "http://127.0.0.1:8000/api";

// 1. 向後端請求動態新聞資料
export async function fetchNews() {
  try {
    const response = await fetch(`${API_BASE_URL}/news`);
    if (!response.ok) throw new Error("API 回應失敗");
    return await response.json();
  } catch (error) {
    console.error("無法取得新聞：", error);
    return []; // 發生錯誤時回傳空陣列，避免畫面崩潰
  }
}

// 2. 向後端請求動態天氣
export async function fetchWeather(region) {
  if (!region) return [];
  try {
    const response = await fetch(`${API_BASE_URL}/weather?region=${region}`);
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error("無法取得天氣：", error);
    return [];
  }
}

// 3. 向後端請求動態星座
export async function fetchHoroscope(zodiac) {
  if (!zodiac) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/horoscope?zodiac=${zodiac}`);
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error("無法取得星座：", error);
    return null;
  }
}