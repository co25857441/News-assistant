import { state, setOnboarded, setPrefs, setFavorites } from './store.js';
import { fetchNews, fetchWeather, fetchHoroscope } from './api.js';
import * as UI from './ui.js'; // 將所有 UI 元件引入

// ==========================================
// 1. 全域動態資料暫存區
// ==========================================
let dynamicData = {
  news: [],
  weather: [],
  horoscope: null
};

// ==========================================
// 2. 輔助邏輯：處理資料排序與篩選
// ==========================================
function getPopularNews() { 
  return [...dynamicData.news].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)); 
}

function getRecommendedNews() { 
  if (!state.prefs?.interests?.length) return getPopularNews(); 
  const { interests, region } = state.prefs; 
  return [...dynamicData.news].map(item => ({ 
    ...item, 
    score: (item.popularity || 0) + (interests.includes(item.category) ? 200 : 0) + (region === "全球" ? 20 : 0) + (region && item.region === region ? 80 : 0) 
  })).sort((a, b) => b.score - a.score); 
}

// ==========================================
// 3. 視圖切換與渲染核心 (Router & Renderer)
// ==========================================
function showView(view) { 
  if (["home", "popular", "favorites"].includes(view)) state.lastMainView = view; 
  state.currentView = view; 
  renderApp(); 
  window.scrollTo({ top: 0, behavior: "smooth" }); 
}

function openDetail(id) { 
  state.currentDetailId = id; 
  showView("detail"); 
}

function renderApp() {
  const app = document.getElementById("app");
  
  // 建立一個路由字典，對應不同狀態要呼叫 UI.js 的哪一個函式
  const views = {
    welcome: () => UI.renderWelcomePage(),
    step1: () => UI.renderStep1(),
    step2: () => UI.renderStep2(),
    step3: () => UI.renderStep3(),
    home: () => UI.renderHomePage(getRecommendedNews(), dynamicData.weather, dynamicData.horoscope),
    popular: () => UI.renderPopularPage(getPopularNews()),
    favorites: () => UI.renderFavoritesPage(dynamicData.news),
    detail: () => UI.renderDetailPage(dynamicData.news)
  };
  
  // 根據當前的 state.currentView，將 HTML 塞入畫面
  app.innerHTML = (views[state.currentView] || views.welcome)();
}

// ==========================================
// 4. 互動邏輯 (Actions)
// ==========================================
function toggleFavorite(id) { 
  const set = new Set(state.favorites); 
  set.has(id) ? set.delete(id) : set.add(id); 
  setFavorites([...set]); 
  renderApp(); 
}

async function shareNews(newsId) { 
  const news = dynamicData.news.find(item => item.id === Number(newsId)); 
  if (!news) return; 
  const text = `${news.title}\n${news.summary}`; 
  try { 
    if (navigator.share) await navigator.share({ title: news.title, text: text, url: news.source_url }); 
    else if (navigator.clipboard) { await navigator.clipboard.writeText(text + '\n' + news.source_url); alert("已複製新聞連結到剪貼簿！"); } 
    else alert("此瀏覽器不支援分享功能。"); 
  } catch { } 
}

// ==========================================
// 5. 事件代理 (Event Delegation) 處理所有點擊
// ==========================================
document.addEventListener("click", async (event) => {
  // 1. 處理導覽列切換
  const routeEl = event.target.closest("[data-route]"); 
  if (routeEl) return showView(routeEl.dataset.route);
  
  // 2. 處理收藏
  const favEl = event.target.closest("[data-fav]"); 
  if (favEl) return toggleFavorite(Number(favEl.dataset.fav));
  
  // 3. 處理分享
  const shareEl = event.target.closest("[data-share]"); 
  if (shareEl) return shareNews(shareEl.dataset.share);
  
  // 4. 處理打開新聞詳細頁
  const openNewsEl = event.target.closest("[data-open-news]"); 
  if (openNewsEl) return openDetail(Number(openNewsEl.dataset.openNews));
  
  // 5. 處理收藏頁的分類按鈕
  const favoriteFilterEl = event.target.closest("[data-favorite-filter]"); 
  if (favoriteFilterEl) { 
    state.favoriteFilter = favoriteFilterEl.dataset.favoriteFilter; 
    return renderApp(); 
  }
  
  // 6. 處理問卷步驟一：選擇興趣 (支援複選)
  const interestEl = event.target.closest("[data-interest]"); 
  if (interestEl) { 
    const value = interestEl.dataset.interest; 
    const set = new Set(state.tempPrefs.interests); 
    set.has(value) ? set.delete(value) : set.add(value); 
    state.tempPrefs.interests = [...set]; 
    return renderApp(); 
  }
  
  // 7. 處理問卷步驟二：選擇地區
  const regionEl = event.target.closest("[data-region]"); 
  if (regionEl) { 
    state.tempPrefs.region = regionEl.dataset.region; 
    return renderApp(); 
  }
  
  // 8. 處理問卷步驟三：選擇星座
  const zodiacEl = event.target.closest("[data-zodiac]"); 
  if (zodiacEl) { 
    state.tempPrefs.zodiac = zodiacEl.dataset.zodiac; 
    return renderApp(); 
  }
  
  // 9. 處理流程控制按鈕 (下一步、上一步等)
  const actionEl = event.target.closest("[data-action]"); 
  if (!actionEl) return;
  
  switch (actionEl.dataset.action) {
    case "start-setup": 
    case "restart-setup": 
      state.tempPrefs = { interests: [], region: "", zodiac: "" }; 
      showView("step1"); 
      break;
      
    case "skip-setup": 
      setOnboarded(true); 
      setPrefs(null); 
      showView("home"); 
      break;
      
    case "cancel-to-welcome": 
      showView("welcome"); 
      break;
      
    case "go-step-2": 
      if (!state.tempPrefs.interests.length) return alert("請至少選擇一個興趣類別。"); 
      showView("step2"); 
      break;
      
    case "back-step-1": 
      showView("step1"); 
      break;
      
    case "go-step-3": 
      if (!state.tempPrefs.region) return alert("請選擇一個關注地區。"); 
      showView("step3"); 
      break;
      
    case "back-step-2": 
      showView("step2"); 
      break;
      
    case "finish-setup": 
      if (!state.tempPrefs.zodiac) return alert("請選擇一個星座。");
      state.prefs = { interests: [...state.tempPrefs.interests], region: state.tempPrefs.region, zodiac: state.tempPrefs.zodiac }; 
      setOnboarded(true); 
      await loadDynamicWidgets(); // 等待抓取天氣與星座完成
      showView("home"); 
      break;
  }
});

// ==========================================
// 6. 系統初始化 (Initialization)
// ==========================================
// 負責向 API 索取個人化資料 (天氣與星座)
async function loadDynamicWidgets() {
  if (state.prefs) {
    dynamicData.weather = await fetchWeather(state.prefs.region);
    dynamicData.horoscope = await fetchHoroscope(state.prefs.zodiac);
  }
}

async function initApp() {
  // 第一步：向後端索取新聞
  dynamicData.news = await fetchNews();
  
  // 第二步：如果有設定過喜好，順便抓取天氣與星座
  await loadDynamicWidgets();
  
  // 第三步：決定進入首頁還是歡迎頁
  state.onboarded ? showView("home") : showView("welcome");
}

initApp();