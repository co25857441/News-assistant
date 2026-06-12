import { fetchNews } from './api.js';

// 由全域變數儲存 API 抓回來的資料
let NEWS = [];

const INTERESTS = ["國內政治", "國際新聞", "財經投資", "科技AI", "生活旅遊", "健康醫療", "體育競技", "娛樂明星", "環境氣候", "社會議題", "教育親子", "美食文化"];
const REGIONS = ["全球", "台灣", "美國", "亞洲", "歐洲"];
const ZODIACS = ["摩羯座", "水瓶座", "雙魚座", "牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座", "天蠍座", "天秤座", "射手座"];
const ZODIAC_SYMBOLS = { "摩羯座": "♑", "水瓶座": "♒", "雙魚座": "♓", "牡羊座": "♈", "金牛座": "♉", "雙子座": "♊", "巨蟹座": "♋", "獅子座": "♌", "處女座": "♍", "天蠍座": "♏", "天秤座": "♎", "射手座": "♐", "綜合運勢": "✦" };
const HOROSCOPES = {
  "牡羊座": { work: 4, money: 3, health: 4, love: 3, tip: "火星能量強勁，適合展開計畫，今天主動出擊會很有收穫。" },
  "金牛座": { work: 4, money: 4, health: 3, love: 3, tip: "穩定中有小突破，務實安排支出與行程，效率會特別好。" },
  "雙子座": { work: 3, money: 3, health: 4, love: 4, tip: "溝通運佳，適合討論與交流，新的想法容易被他人看見。" },
  "巨蟹座": { work: 4, money: 3, health: 4, love: 5, tip: "情感敏銳，與家人朋友互動順利，也適合整理生活節奏。" },
  "獅子座": { work: 5, money: 4, health: 3, love: 4, tip: "你今天的存在感特別高，適合上台、簡報、表達自我。" },
  "處女座": { work: 5, money: 3, health: 4, love: 3, tip: "細節掌控力很強，適合把零散事項整理完成。" },
  "天秤座": { work: 4, money: 3, health: 3, love: 5, tip: "人際互動順暢，適合合作與協調，也容易遇到好消息。" },
  "天蠍座": { work: 4, money: 4, health: 3, love: 4, tip: "直覺敏銳，適合深入分析與做重要判斷。" },
  "射手座": { work: 3, money: 4, health: 4, love: 3, tip: "想法自由、行動力高，很適合規劃旅行或新的挑戰。" },
  "摩羯座": { work: 5, money: 4, health: 3, love: 3, tip: "今天的你很適合穩紮穩打，重要任務有機會順利推進。" },
  "水瓶座": { work: 4, money: 3, health: 4, love: 4, tip: "創意靈感豐富，特別適合科技、創作與新企劃。" },
  "雙魚座": { work: 3, money: 3, health: 4, love: 5, tip: "感受力強，適合沉澱情緒，也容易得到溫暖支持。" },
  "綜合運勢": { work: 4, money: 3, health: 4, love: 4, tip: "尚未設定星座，先為你顯示今日綜合提醒：保持步調穩定，會有不錯的進展。" }
};

const WEATHER_BY_REGION = {
  "全球": [{ area: "台北", weather: "多雲", temp: "28°C", rain: "30%" }, { area: "東京", weather: "晴", temp: "26°C", rain: "10%" }, { area: "紐約", weather: "陰", temp: "22°C", rain: "25%" }],
  "台灣": [{ area: "台北", weather: "多雲", temp: "28°C", rain: "30%" }, { area: "台中", weather: "晴", temp: "29°C", rain: "20%" }, { area: "高雄", weather: "晴", temp: "31°C", rain: "10%" }],
  "美國": [{ area: "紐約", weather: "陰", temp: "22°C", rain: "25%" }, { area: "舊金山", weather: "晴", temp: "20°C", rain: "5%" }, { area: "西雅圖", weather: "小雨", temp: "18°C", rain: "60%" }],
  "亞洲": [{ area: "東京", weather: "晴", temp: "26°C", rain: "10%" }, { area: "首爾", weather: "多雲", temp: "24°C", rain: "20%" }, { area: "曼谷", weather: "雷雨", temp: "33°C", rain: "70%" }],
  "歐洲": [{ area: "巴黎", weather: "多雲", temp: "19°C", rain: "20%" }, { area: "倫敦", weather: "陰", temp: "17°C", rain: "35%" }, { area: "柏林", weather: "晴", temp: "18°C", rain: "15%" }]
};

const STORAGE_KEYS = { ONBOARDED: "newsHelper_onboarded", PREFS: "newsHelper_prefs", FAVORITES: "newsHelper_favorites" };
const state = { 
  currentView: "welcome", 
  lastMainView: "home", 
  currentDetailId: null, 
  favoriteFilter: "全部", 
  tempPrefs: { interests: [], region: "", zodiac: "" }, 
  prefs: loadFromStorage(STORAGE_KEYS.PREFS, null), 
  favorites: loadFromStorage(STORAGE_KEYS.FAVORITES, []), 
  onboarded: loadFromStorage(STORAGE_KEYS.ONBOARDED, false) 
};

function loadFromStorage(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
function saveToStorage(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function setOnboarded(value) { state.onboarded = value; saveToStorage(STORAGE_KEYS.ONBOARDED, value); }
function setPrefs(prefs) { state.prefs = prefs; saveToStorage(STORAGE_KEYS.PREFS, prefs); }
function setFavorites(favorites) { state.favorites = favorites; saveToStorage(STORAGE_KEYS.FAVORITES, favorites); }

function showView(view) { 
  if (["home", "popular", "favorites"].includes(view)) state.lastMainView = view; 
  state.currentView = view; 
  render(); 
  window.scrollTo({ top: 0, behavior: "smooth" }); 
}

function openDetail(id) { state.currentDetailId = id; showView("detail"); }

// 依照資料庫的設計，加入對應欄位的容錯處理
function getPopularNews() { return [...NEWS].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)); }
function getRecommendedNews() { 
  if (!state.prefs?.interests?.length) return getPopularNews(); 
  const { interests, region } = state.prefs; 
  return [...NEWS].map(item => ({ 
    ...item, 
    score: (item.popularity || 0) + (interests.includes(item.category) ? 200 : 0) + (region === "全球" ? 20 : 0) + (region && item.region === region ? 80 : 0) 
  })).sort((a, b) => b.score - a.score); 
}

function toggleFavorite(id) { const set = new Set(state.favorites); set.has(id) ? set.delete(id) : set.add(id); setFavorites([...set]); render(); }
function isFavorite(id) { return state.favorites.includes(id); }
function renderStars(score) { return Array.from({ length: 5 }, (_, i) => i < score ? "★" : "☆").join(" "); }
function getHoroscope() { const sign = state.prefs?.zodiac || "綜合運勢"; return { sign, symbol: ZODIAC_SYMBOLS[sign] || "✦", ...HOROSCOPES[sign] }; }
function getWeatherRows() { return WEATHER_BY_REGION[state.prefs?.region || "全球"] || WEATHER_BY_REGION["全球"]; }

//function renderNav(activeView) { return `<header class="topbar"><div class="brand">新聞小助手</div><nav class="nav" aria-label="主選單"><button class="nav-link ${activeView === "home" ? "active" : ""}" data-route="home">首頁</button><button class="nav-link ${activeView === "popular" ? "active" : ""}" data-route="popular">今日熱門</button><button class="nav-link ${activeView === "favorites" ? "active" : ""}" data-route="favorites">收藏頁</button></nav></header>`; }
function renderNav(activeView) { 
  return `
    <header class="topbar">
      <div class="brand">新聞小助手</div>
      <nav class="nav" aria-label="主選單">
        <button class="nav-link ${activeView === "home" ? "active" : ""}" data-route="home">首頁</button>
        <button class="nav-link ${activeView === "popular" ? "active" : ""}" data-route="popular">今日熱門</button>
        <button class="nav-link ${activeView === "favorites" ? "active" : ""}" data-route="favorites">收藏頁</button>
        <button class="nav-link" data-action="restart-setup">⚙️ 重新設定</button>
      </nav>
    </header>
  `; 
}
function renderFavoriteButton(id) { return `<button class="icon-btn ${isFavorite(id) ? "active" : ""}" data-fav="${id}" aria-label="收藏新聞">${isFavorite(id) ? "♥" : "♡"}</button>`; }

// 卡片與詳細頁適配後端欄位 (image_url, published_at)
function renderNewsCard(news, size = "small") { 
  if (!news) return ''; 
  const titleClass = size === "large" ? "news-title" : size === "medium" ? "news-title medium" : "news-title small"; 
  const imgUrl = news.image_url || "https://via.placeholder.com/600x400?text=No+Image";
  const timeStr = news.published_at ? news.published_at.substring(0, 10) : (news.time || "近期");
  
  return `<article class="news-card clickable" data-open-news="${news.id}"><div class="news-top"><div class="news-meta"><span class="tag">${news.category}｜${news.region}</span><h3 class="${titleClass}">${news.title}</h3><p class="news-summary">${news.summary}</p></div>${renderFavoriteButton(news.id)}</div><div class="news-image"><img src="${imgUrl}" alt="${news.title}"></div><div class="card-footer"><span>${timeStr}</span><span>點擊閱讀更多</span></div></article>`; 
}

function renderHoroscopePanel() { const h = getHoroscope(); return `<div class="horoscope-box"><div style="font-size:1.5rem;font-weight:800;">星座運勢</div><div class="horoscope-head"><div class="zodiac-avatar">${h.symbol}</div><div class="zodiac-meta"><h3>${h.sign}</h3><div class="star-line">${renderStars(Math.round((h.work + h.money + h.health + h.love) / 4))}</div><div style="color: var(--muted);">今日整體運勢</div></div></div><div class="score-grid"><div class="score-row"><span>學業/工作</span><span>${renderStars(h.work)}</span></div><div class="score-row"><span>財運</span><span>${renderStars(h.money)}</span></div><div class="score-row"><span>健康</span><span>${renderStars(h.health)}</span></div><div class="score-row"><span>愛情</span><span>${renderStars(h.love)}</span></div></div><div class="tip-box">${h.tip}</div></div>`; }
function renderWeatherPanel() { return `<div class="weather-card"><h3>天氣資訊</h3><table class="weather-table"><thead><tr><th>地區</th><th>天氣</th><th>溫度</th><th>降雨機率</th></tr></thead><tbody>${getWeatherRows().map(row => `<tr><td>${row.area}</td><td>${row.weather}</td><td>${row.temp}</td><td>${row.rain}</td></tr>`).join("")}</tbody></table><div style="color:var(--muted);font-size:0.95rem;">此區可日後替換為真實天氣 API。</div></div>`; }
function renderPreferenceHints() { if (!state.prefs) return `<div class="pref-hint"><span class="hint-pill">尚未完成個人偏好設定</span><span class="hint-pill">目前以熱門新聞作為預設推薦</span></div>`; return `<div class="pref-hint"><span class="hint-pill">興趣：${state.prefs.interests.join("、") || "未設定"}</span><span class="hint-pill">地區：${state.prefs.region || "未設定"}</span><span class="hint-pill">星座：${state.prefs.zodiac || "未設定"}</span></div>`; }
function renderHomePage() { const list = getRecommendedNews(); return `<div class="app-shell">${renderNav("home")}<main>${renderPreferenceHints()}<div class="home-grid"><section class="panel featured-wrap">${renderNewsCard(list[0], "large")}</section><section class="panel secondary-wrap">${renderNewsCard(list[1] || list[0], "medium")}</section><section class="panel horoscope-wrap">${renderHoroscopePanel()}</section><section class="panel bottom-left-wrap">${renderNewsCard(list[2] || list[0], "small")}</section><section class="panel bottom-mid-wrap">${renderNewsCard(list[3] || list[0], "small")}</section><section class="panel weather-wrap">${renderWeatherPanel()}</section></div></main></div>`; }
function renderPopularPage() { return `<div class="app-shell">${renderNav("popular")}<main><h2 class="section-title">焦點新聞</h2><section class="cards-grid">${getPopularNews().map(item => `<div class="panel popular-card">${renderNewsCard(item, "medium")}</div>`).join("")}</section></main></div>`; }
function renderWelcomePage() { return `<div class="onboard-shell"><section class="onboard-card"><div class="welcome-content"><h1 class="welcome-title">WELCOME!</h1><p class="welcome-text">告訴我們你關注的焦點，我會提供你每日推薦新聞喔！<br>同時還有每日星座運勢，還可以收藏與分享新聞！</p></div><div class="welcome-actions"><button class="btn secondary" data-action="skip-setup">略過，直接看熱門新聞</button><button class="btn primary" data-action="start-setup">開始設定</button></div></section></div>`; }
function renderStepHeader(step) { return `<div class="progress-row"><div class="progress-bar ${step >= 1 ? "active" : ""}"></div><div class="progress-bar ${step >= 2 ? "active" : ""}"></div><div class="progress-bar ${step >= 3 ? "active" : ""}"></div><div class="step-text">步驟 ${step}/3</div></div>`; }
function renderStep1() { return `<div class="onboard-shell"><section class="onboard-card">${renderStepHeader(1)}<h2 class="wizard-title">花 30 秒告訴我們你喜歡什麼，我來幫你打造專屬的新聞頁面！</h2><div class="option-grid">${INTERESTS.map(item => `<button class="option-btn ${state.tempPrefs.interests.includes(item) ? "selected" : ""}" data-interest="${item}">${item}</button>`).join("")}</div><div class="subtle-note">可複選，至少選擇 1 個興趣類別。</div><div class="wizard-actions"><button class="btn secondary" data-action="cancel-to-welcome">返回歡迎頁</button><button class="btn primary" data-action="go-step-2">下一步</button></div></section></div>`; }
function renderStep2() { return `<div class="onboard-shell"><section class="onboard-card">${renderStepHeader(2)}<h2 class="wizard-title">你關注於哪個地區的新聞呢？</h2><div class="option-list">${REGIONS.map(region => `<button class="option-btn ${state.tempPrefs.region === region ? "selected" : ""}" data-region="${region}">${region}</button>`).join("")}</div><div class="wizard-actions"><button class="btn secondary" data-action="back-step-1">上一步</button><button class="btn primary" data-action="go-step-3">下一步</button></div></section></div>`; }
function renderStep3() { return `<div class="onboard-shell"><section class="onboard-card">${renderStepHeader(3)}<h2 class="wizard-title">告訴我們你的星座，每天進來就能看到專屬運勢喔！</h2><div class="option-grid">${ZODIACS.map(item => `<button class="option-btn ${state.tempPrefs.zodiac === item ? "selected" : ""}" data-zodiac="${item}">${item}</button>`).join("")}</div><div class="wizard-actions"><button class="btn secondary" data-action="back-step-2">上一步</button><button class="btn primary" data-action="finish-setup">完成設定</button></div></section></div>`; }




function renderFavoritesPage() { 
  const favoriteNews = NEWS.filter(item => state.favorites.includes(item.id)); 
  const categories = ["全部", ...new Set(favoriteNews.map(item => item.category))]; 
  const filtered = state.favoriteFilter === "全部" ? favoriteNews : favoriteNews.filter(item => item.category === state.favoriteFilter); 
  return `<div class="app-shell">${renderNav("favorites")}<main><h2 class="section-title">我的收藏</h2>${favoriteNews.length ? `<div class="filter-row">${categories.map(c => `<button class="chip ${state.favoriteFilter === c ? "active" : ""}" data-favorite-filter="${c}">${c}</button>`).join("")}</div>` : ""}${!favoriteNews.length ? `<div class="empty-state">目前還沒有收藏新聞。<br>你可以到首頁或今日熱門點擊 ♡ 收藏喜歡的新聞。</div>` : `<section class="cards-grid">${filtered.length ? filtered.map(item => `<div class="panel popular-card">${renderNewsCard(item, "medium")}</div>`).join("") : `<div class="empty-state" style="grid-column:1/-1;">這個分類目前沒有收藏內容。</div>`}</section>`}</main></div>`; 
}

function renderDetailPage() { 
  const news = NEWS.find(item => item.id === state.currentDetailId); 
  if (!news) return `<div class="app-shell">${renderNav(state.lastMainView)}<div class="empty-state">找不到這篇新聞。</div></div>`; 
  
  const imgUrl = news.image_url || "https://via.placeholder.com/1200x800?text=No+Image";
  const timeStr = news.published_at ? news.published_at.substring(0, 10) : "";

  return `<div class="app-shell">${renderNav(state.lastMainView)}<main><button class="back-link" data-route="${state.lastMainView}">← 回到上一頁</button><section class="detail-panel"><div class="detail-header"><h1 class="detail-title">${news.title}</h1><div class="detail-actions">${renderFavoriteButton(news.id)}<button class="icon-btn" data-share="${news.id}" aria-label="分享新聞">↗</button></div></div><div class="detail-meta"><span class="tag">${news.category}</span><span>${news.region}</span><span>${timeStr}</span></div><div class="detail-image"><img src="${imgUrl}" alt="${news.title}"></div><div class="detail-content"><p>${news.summary}</p><br><a href="${news.source_url}" target="_blank" class="btn primary" style="display:inline-block; text-decoration:none;">前往原新聞閱讀完整內容</a></div></section></main></div>`; 
}

function render() { 
  const app = document.getElementById("app"); 
  const views = { welcome: renderWelcomePage, step1: renderStep1, step2: renderStep2, step3: renderStep3, home: renderHomePage, popular: renderPopularPage, favorites: renderFavoritesPage, detail: renderDetailPage }; 
  app.innerHTML = (views[state.currentView] || renderWelcomePage)(); 
}

function handleSkipSetup() { setOnboarded(true); setPrefs(null); showView("home"); }
function handleFinishSetup() { 
  if (!state.tempPrefs.zodiac) { alert("請選擇一個星座。"); return; } 
  setPrefs({ interests: [...state.tempPrefs.interests], region: state.tempPrefs.region, zodiac: state.tempPrefs.zodiac }); 
  setOnboarded(true); 
  showView("home"); 
}

async function shareNews(newsId) { 
  const news = NEWS.find(item => item.id === Number(newsId)); 
  if (!news) return; 
  // 分享改為分享外部的新聞原連結
  const text = `${news.title}\n${news.summary}`; 
  try { 
    if (navigator.share) await navigator.share({ title: news.title, text: text, url: news.source_url }); 
    else if (navigator.clipboard) { await navigator.clipboard.writeText(text + '\n' + news.source_url); alert("已複製新聞連結到剪貼簿！"); } 
    else alert("此瀏覽器不支援分享功能。"); 
  } catch { } 
}

// 事件代理保持不變
document.addEventListener("click", (event) => {
  const routeEl = event.target.closest("[data-route]"); if (routeEl) return showView(routeEl.dataset.route);
  const favEl = event.target.closest("[data-fav]"); if (favEl) { return toggleFavorite(Number(favEl.dataset.fav)); }
  const shareEl = event.target.closest("[data-share]"); if (shareEl) return shareNews(shareEl.dataset.share);
  const openNewsEl = event.target.closest("[data-open-news]"); if (openNewsEl) return openDetail(Number(openNewsEl.dataset.openNews));
  const favoriteFilterEl = event.target.closest("[data-favorite-filter]"); if (favoriteFilterEl) { state.favoriteFilter = favoriteFilterEl.dataset.favoriteFilter; return render(); }
  const interestEl = event.target.closest("[data-interest]"); if (interestEl) { const value = interestEl.dataset.interest; const set = new Set(state.tempPrefs.interests); set.has(value) ? set.delete(value) : set.add(value); state.tempPrefs.interests = [...set]; return render(); }
  const regionEl = event.target.closest("[data-region]"); if (regionEl) { state.tempPrefs.region = regionEl.dataset.region; return render(); }
  const zodiacEl = event.target.closest("[data-zodiac]"); if (zodiacEl) { state.tempPrefs.zodiac = zodiacEl.dataset.zodiac; return render(); }
  const actionEl = event.target.closest("[data-action]"); if (!actionEl) return;
  
  switch (actionEl.dataset.action) {
    case "start-setup": state.tempPrefs = { interests: [], region: "", zodiac: "" }; showView("step1"); break;
    //重設興趣
    case "restart-setup": state.tempPrefs = { interests: [], region: "", zodiac: "" }; showView("step1"); break;

    case "skip-setup": handleSkipSetup(); break;
    case "cancel-to-welcome": showView("welcome"); break;
    case "go-step-2": if (!state.tempPrefs.interests.length) return alert("請至少選擇一個興趣類別。"); showView("step2"); break;
    case "back-step-1": showView("step1"); break;
    case "go-step-3": if (!state.tempPrefs.region) return alert("請選擇一個關注地區。"); showView("step3"); break;
    case "back-step-2": showView("step2"); break;
    case "finish-setup": handleFinishSetup(); break;
  }
});

// 系統初始化：啟動時先去後端抓新聞，抓完再決定渲染哪個頁面
async function initApp() {
  NEWS = await fetchNews();
  state.onboarded ? showView("home") : showView("welcome");
}

// 執行初始化
initApp();