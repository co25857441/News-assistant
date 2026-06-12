import { state } from './store.js';

// ==========================================
// 1. 介面選項常數 (負責渲染問卷按鈕)
// ==========================================
export const INTERESTS = ["國內政治", "國際新聞", "財經投資", "科技AI", "生活旅遊", "健康醫療", "體育競技", "娛樂明星", "環境氣候", "社會議題", "教育親子", "美食文化"];
export const REGIONS = ["全球", "台灣", "美國", "亞洲", "歐洲"];
export const ZODIACS = ["摩羯座", "水瓶座", "雙魚座", "牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座", "天蠍座", "天秤座", "射手座"];

// ==========================================
// 2. 共用小元件 (Components)
// ==========================================

// 輔助函式：渲染星星評分
export function renderStars(score) { 
  return Array.from({ length: 5 }, (_, i) => i < score ? "★" : "☆").join(" "); 
}

// 頂部導覽列 (包含重新設定按鈕)
export function renderNav(activeView) { 
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

// 收藏愛心按鈕
export function renderFavoriteButton(id) { 
  const isFav = state.favorites.includes(id);
  return `<button class="icon-btn ${isFav ? "active" : ""}" data-fav="${id}" aria-label="收藏新聞">${isFav ? "♥" : "♡"}</button>`; 
}

// ==========================================
// 3. 資訊卡片區塊 (Cards)
// ==========================================

// 單張新聞卡片
export function renderNewsCard(news, size = "small") { 
  if (!news) return ''; 
  const titleClass = size === "large" ? "news-title" : size === "medium" ? "news-title medium" : "news-title small"; 
  const imgUrl = news.image_url || "https://via.placeholder.com/600x400?text=No+Image";
  const timeStr = news.published_at ? news.published_at.substring(0, 10) : (news.time || "近期");
  
  return `
    <article class="news-card clickable" data-open-news="${news.id}">
      <div class="news-top">
        <div class="news-meta">
          <span class="tag">${news.category}｜${news.region}</span>
          <h3 class="${titleClass}">${news.title}</h3>
          <p class="news-summary">${news.summary}</p>
        </div>
        ${renderFavoriteButton(news.id)}
      </div>
      <div class="news-image"><img src="${imgUrl}" alt="${news.title}"></div>
      <div class="card-footer">
        <span>${timeStr}</span>
        <span>點擊閱讀更多</span>
      </div>
    </article>
  `; 
}

// 動態星座運勢卡片
export function renderHoroscopePanel(horoscopeData) { 
  if (!horoscopeData) return `<div class="horoscope-box"><div class="empty-state">載入運勢中...</div></div>`;
  
  // 依照傳入的動態資料計算總分
  const score = Math.round((horoscopeData.work + horoscopeData.money + horoscopeData.health + horoscopeData.love) / 4) || 4;
  
  return `
    <div class="horoscope-box">
      <div style="font-size:1.5rem;font-weight:800;">星座運勢</div>
      <div class="horoscope-head">
        <div class="zodiac-avatar">${horoscopeData.symbol || "✦"}</div>
        <div class="zodiac-meta">
          <h3>${horoscopeData.sign}</h3>
          <div class="star-line">${renderStars(score)}</div>
          <div style="color: var(--muted);">今日整體運勢</div>
        </div>
      </div>
      <div class="score-grid">
        <div class="score-row"><span>學業/工作</span><span>${renderStars(horoscopeData.work || 4)}</span></div>
        <div class="score-row"><span>財運</span><span>${renderStars(horoscopeData.money || 4)}</span></div>
        <div class="score-row"><span>健康</span><span>${renderStars(horoscopeData.health || 4)}</span></div>
        <div class="score-row"><span>愛情</span><span>${renderStars(horoscopeData.love || 4)}</span></div>
      </div>
      <div class="tip-box">${horoscopeData.tip}</div>
    </div>
  `; 
}

// 動態天氣資訊卡片
export function renderWeatherPanel(weatherData) { 
  if (!weatherData || weatherData.length === 0) return `<div class="weather-card"><h3>天氣資訊</h3><div class="empty-state">載入天氣中...</div></div>`;
  return `
    <div class="weather-card">
      <h3>天氣資訊</h3>
      <table class="weather-table">
        <thead>
          <tr><th>地區</th><th>天氣</th><th>溫度</th><th>降雨機率</th></tr>
        </thead>
        <tbody>
          ${weatherData.map(row => `<tr><td>${row.area}</td><td>${row.weather}</td><td>${row.temp}</td><td>${row.rain || '--'}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  `; 
}

// 個人化設定標籤提示
export function renderPreferenceHints() { 
  if (!state.prefs) {
    return `
      <div class="pref-hint">
        <span class="hint-pill">尚未完成個人偏好設定</span>
        <span class="hint-pill">目前以熱門新聞作為預設推薦</span>
      </div>
    `; 
  }
  return `
    <div class="pref-hint">
      <span class="hint-pill">興趣：${state.prefs.interests.join("、") || "未設定"}</span>
      <span class="hint-pill">地區：${state.prefs.region || "未設定"}</span>
      <span class="hint-pill">星座：${state.prefs.zodiac || "未設定"}</span>
    </div>
  `; 
}

// ==========================================
// 4. 問卷流程頁面 (Onboarding)
// ==========================================

export function renderWelcomePage() { 
  return `
    <div class="onboard-shell">
      <section class="onboard-card">
        <div class="welcome-content">
          <h1 class="welcome-title">WELCOME!</h1>
          <p class="welcome-text">告訴我們你關注的焦點，我會提供你每日推薦新聞喔！<br>同時還有每日星座運勢，還可以收藏與分享新聞！</p>
        </div>
        <div class="welcome-actions">
          <button class="btn secondary" data-action="skip-setup">略過，直接看熱門新聞</button>
          <button class="btn primary" data-action="start-setup">開始設定</button>
        </div>
      </section>
    </div>
  `; 
}

export function renderStepHeader(step) { 
  return `
    <div class="progress-row">
      <div class="progress-bar ${step >= 1 ? "active" : ""}"></div>
      <div class="progress-bar ${step >= 2 ? "active" : ""}"></div>
      <div class="progress-bar ${step >= 3 ? "active" : ""}"></div>
      <div class="step-text">步驟 ${step}/3</div>
    </div>
  `; 
}

export function renderStep1() { 
  return `
    <div class="onboard-shell">
      <section class="onboard-card">
        ${renderStepHeader(1)}
        <h2 class="wizard-title">花 30 秒告訴我們你喜歡什麼，我來幫你打造專屬的新聞頁面！</h2>
        <div class="option-grid">
          ${INTERESTS.map(item => `<button class="option-btn ${state.tempPrefs.interests.includes(item) ? "selected" : ""}" data-interest="${item}">${item}</button>`).join("")}
        </div>
        <div class="subtle-note">可複選，至少選擇 1 個興趣類別。</div>
        <div class="wizard-actions">
          <button class="btn secondary" data-action="cancel-to-welcome">返回歡迎頁</button>
          <button class="btn primary" data-action="go-step-2">下一步</button>
        </div>
      </section>
    </div>
  `; 
}

export function renderStep2() { 
  return `
    <div class="onboard-shell">
      <section class="onboard-card">
        ${renderStepHeader(2)}
        <h2 class="wizard-title">你關注於哪個地區的新聞呢？</h2>
        <div class="option-list">
          ${REGIONS.map(region => `<button class="option-btn ${state.tempPrefs.region === region ? "selected" : ""}" data-region="${region}">${region}</button>`).join("")}
        </div>
        <div class="wizard-actions">
          <button class="btn secondary" data-action="back-step-1">上一步</button>
          <button class="btn primary" data-action="go-step-3">下一步</button>
        </div>
      </section>
    </div>
  `; 
}

export function renderStep3() { 
  return `
    <div class="onboard-shell">
      <section class="onboard-card">
        ${renderStepHeader(3)}
        <h2 class="wizard-title">告訴我們你的星座，每天進來就能看到專屬運勢喔！</h2>
        <div class="option-grid">
          ${ZODIACS.map(item => `<button class="option-btn ${state.tempPrefs.zodiac === item ? "selected" : ""}" data-zodiac="${item}">${item}</button>`).join("")}
        </div>
        <div class="wizard-actions">
          <button class="btn secondary" data-action="back-step-2">上一步</button>
          <button class="btn primary" data-action="finish-setup">完成設定</button>
        </div>
      </section>
    </div>
  `; 
}

// ==========================================
// 5. 核心頁面外框 (Pages)
// ==========================================

// 首頁
export function renderHomePage(newsList, weatherData, horoscopeData) { 
  return `
    <div class="app-shell">
      ${renderNav("home")}
      <main>
        ${renderPreferenceHints()}
        <div class="home-grid">
          <section class="panel featured-wrap">${renderNewsCard(newsList[0], "large")}</section>
          <section class="panel secondary-wrap">${renderNewsCard(newsList[1] || newsList[0], "medium")}</section>
          <section class="panel horoscope-wrap">${renderHoroscopePanel(horoscopeData)}</section>
          <section class="panel bottom-left-wrap">${renderNewsCard(newsList[2] || newsList[0], "small")}</section>
          <section class="panel bottom-mid-wrap">${renderNewsCard(newsList[3] || newsList[0], "small")}</section>
          <section class="panel weather-wrap">${renderWeatherPanel(weatherData)}</section>
        </div>
      </main>
    </div>
  `; 
}

// 今日熱門頁
export function renderPopularPage(popularNews) { 
  return `
    <div class="app-shell">
      ${renderNav("popular")}
      <main>
        <h2 class="section-title">焦點新聞</h2>
        <section class="cards-grid">
          ${popularNews.map(item => `<div class="panel popular-card">${renderNewsCard(item, "medium")}</div>`).join("")}
        </section>
      </main>
    </div>
  `; 
}

// 收藏頁
export function renderFavoritesPage(allNews) { 
  const favoriteNews = allNews.filter(item => state.favorites.includes(item.id)); 
  const categories = ["全部", ...new Set(favoriteNews.map(item => item.category))]; 
  const filtered = state.favoriteFilter === "全部" ? favoriteNews : favoriteNews.filter(item => item.category === state.favoriteFilter); 
  
  return `
    <div class="app-shell">
      ${renderNav("favorites")}
      <main>
        <h2 class="section-title">我的收藏</h2>
        ${favoriteNews.length ? `<div class="filter-row">${categories.map(c => `<button class="chip ${state.favoriteFilter === c ? "active" : ""}" data-favorite-filter="${c}">${c}</button>`).join("")}</div>` : ""}
        ${!favoriteNews.length ? `<div class="empty-state">目前還沒有收藏新聞。<br>你可以到首頁或今日熱門點擊 ♡ 收藏喜歡的新聞。</div>` : `<section class="cards-grid">${filtered.length ? filtered.map(item => `<div class="panel popular-card">${renderNewsCard(item, "medium")}</div>`).join("") : `<div class="empty-state" style="grid-column:1/-1;">這個分類目前沒有收藏內容。</div>`}</section>`}
      </main>
    </div>
  `; 
}

// 新聞詳細頁
export function renderDetailPage(allNews) { 
  const news = allNews.find(item => item.id === state.currentDetailId); 
  if (!news) return `<div class="app-shell">${renderNav(state.lastMainView)}<div class="empty-state">找不到這篇新聞。</div></div>`; 
  
  const imgUrl = news.image_url || "https://via.placeholder.com/1200x800?text=No+Image";
  const timeStr = news.published_at ? news.published_at.substring(0, 10) : "";

  return `
    <div class="app-shell">
      ${renderNav(state.lastMainView)}
      <main>
        <button class="back-link" data-route="${state.lastMainView}">← 回到上一頁</button>
        <section class="detail-panel">
          <div class="detail-header">
            <h1 class="detail-title">${news.title}</h1>
            <div class="detail-actions">
              ${renderFavoriteButton(news.id)}
              <button class="icon-btn" data-share="${news.id}" aria-label="分享新聞">↗</button>
            </div>
          </div>
          <div class="detail-meta">
            <span class="tag">${news.category}</span>
            <span>${news.region}</span>
            <span>${timeStr}</span>
          </div>
          <div class="detail-image"><img src="${imgUrl}" alt="${news.title}"></div>
          <div class="detail-content">
            <p>${news.summary}</p><br>
            <a href="${news.source_url}" target="_blank" class="btn primary" style="display:inline-block; text-decoration:none;">前往原新聞閱讀完整內容</a>
          </div>
        </section>
      </main>
    </div>
  `; 
}