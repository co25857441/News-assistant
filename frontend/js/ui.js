import { state } from "./store.js";

export const INTERESTS = [
  "政治",
  "軍武",
  "社會",
  "生活",
  "健康",
  "國際",
  "地方",
  "蒐奇",
  "影音",
  "財經",
  "娛樂",
  "汽車",
  "時尚",
  "體育",
  "3C",
  "評論",
  "藝文",
  "玩咖",
  "食譜",
  "地產"
];

const INTEREST_IMAGES = {
  "政治": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=80",
  "軍武": "https://images.unsplash.com/photo-1521790361543-f645cf042ec4?auto=format&fit=crop&w=900&q=80",
  "社會": "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
  "生活": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  "健康": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=900&q=80",
  "國際": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80",
  "地方": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80",
  "蒐奇": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
  "影音": "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80",
  "財經": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=900&q=80",
  "娛樂": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80",
  "汽車": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
  "時尚": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
  "體育": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80",
  "3C": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "評論": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80",
  "藝文": "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=900&q=80",
  "玩咖": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  "食譜": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  "地產": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80"
};

export const REGIONS = [
  "台北市",
  "新北市",
  "桃園市",
  "台中市",
  "台南市",
  "高雄市",
  "基隆市",
  "新竹市",
  "嘉義市",
  "新竹縣",
  "苗栗縣",
  "彰化縣",
  "南投縣",
  "雲林縣",
  "嘉義縣",
  "屏東縣",
  "宜蘭縣",
  "花蓮縣",
  "台東縣",
  "澎湖縣",
  "金門縣",
  "連江縣"
];

export const ZODIACS = [
  "牡羊座",
  "金牛座",
  "雙子座",
  "巨蟹座",
  "獅子座",
  "處女座",
  "天秤座",
  "天蠍座",
  "射手座",
  "摩羯座",
  "水瓶座",
  "雙魚座"
];

const ZODIAC_ICONS = {
  "牡羊座": "♈",
  "金牛座": "♉",
  "雙子座": "♊",
  "巨蟹座": "♋",
  "獅子座": "♌",
  "處女座": "♍",
  "天秤座": "♎",
  "天蠍座": "♏",
  "射手座": "♐",
  "摩羯座": "♑",
  "水瓶座": "♒",
  "雙魚座": "♓"
};

const PAGE_SIZE = 12;

function escapeText(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getPageItems(items, page = state.currentPage) {
  return items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

function getPageCount(items) {
  const total = Array.isArray(items) ? items.length : Number(items);
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function renderStars(score) {
  return Array.from({ length: 5 }, (_, i) => (i < score ? "★" : "☆")).join(" ");
}

export function renderNav(activeView) {
  return `
    <header class="topbar">
      <div class="brand" data-route="home">新聞小助手</div>
      <nav class="nav" aria-label="主要導覽">
         ${state.user ? `
            <span class="nav-user-greeting">
              Hi~ ${escapeText(state.user.name || state.user.email || "使用者")}
            </span>
            <button class="nav-link" data-action="logout">登出</button>
          ` : ""}
        <button class="nav-link ${activeView === "home" ? "active" : ""}" data-route="home">首頁</button>
        <button class="nav-link ${activeView === "popular" ? "active" : ""}" data-route="popular">熱門</button>
        <button class="nav-link ${activeView === "favorites" ? "active" : ""}" data-route="favorites">收藏</button>
        <button class="nav-link ${activeView === "login" ? "active" : ""}" data-route="login">登入</button>
        <div class="nav-menu">
          <button class="nav-link ${activeView === "settings" ? "active" : ""}" type="button">設定</button>
          <div class="dropdown-menu">
            <button data-action="restart-setup">重新設定個人興趣</button>
            <button data-route="settings">個性化設定</button>
          </div>
        </div>
      </nav>
    </header>
  `;
}

export function renderFavoriteButton(id) {
  const isFav = state.favorites.includes(Number(id));
  return `<button class="icon-btn ${isFav ? "active" : ""}" data-fav="${id}" aria-label="收藏新聞">${isFav ? "♥" : "♡"}</button>`;
}

function getNewsImageUrl(news) {
  const imageUrl = String(news?.image_url || "").trim();
  const categoryFallback = INTEREST_IMAGES[news?.category] || "news-background-2.png";
  if (!imageUrl) return categoryFallback;

  const lowerUrl = imageUrl.toLowerCase();
  const isLogoLike = [
    "logo",
    "apple-touch-icon",
    "app-icon",
    "favicon",
    "fb_ltn",
    "ltn.png"
  ].some(keyword => lowerUrl.includes(keyword));

  return isLogoLike ? categoryFallback : imageUrl;
}

export function renderNewsCard(news, size = "small") {
  if (!news) return "";

  const titleClass = size === "large" ? "news-title" : size === "medium" ? "news-title medium" : "news-title small";
  const imgUrl = getNewsImageUrl(news);
  const fallbackImgUrl = INTEREST_IMAGES[news?.category] || "news-background-2.png";
  const timeStr = news.published_at ? String(news.published_at).substring(0, 10) : "尚無日期";
  const readClass = state.readNews.map(Number).includes(Number(news.id)) ? " is-read" : "";

  return `
    <article class="news-card clickable reveal-card${readClass}" data-open-news="${news.id}">
      <div class="news-image">
        <img src="${escapeText(imgUrl)}" alt="${escapeText(news.title || "新聞圖片")}" onerror="this.onerror=null;this.src='${escapeText(fallbackImgUrl)}';">
      </div>
      <div class="news-top">
        <div class="news-meta">
          <div class="tag-row">
            <span class="tag">${escapeText(news.category || "未分類")}</span>
          </div>
          <h3 class="${titleClass}">${escapeText(news.title || "未命名新聞")}</h3>
          <p class="news-summary">${escapeText(news.summary || "目前沒有摘要內容。")}</p>
        </div>
        ${renderFavoriteButton(news.id)}
      </div>
      <div class="card-footer">
        <span>${timeStr}</span>
        <span>${escapeText(news.source || "新聞來源")}</span>
      </div>
    </article>
  `;
}

export function renderHoroscopePanel(horoscopeData) {
  if (!horoscopeData) {
    return `<div class="horoscope-box"><div class="empty-state compact">尚未載入星座運勢</div></div>`;
  }

  const tipText = horoscopeData.tip || "今天適合先整理資訊，再做決定。";
  const tipSections = tipText.includes("｜")
    ? tipText.split("\n").map(line => {
      const [title, ...contentParts] = line.split("｜");
      return { title: title.trim(), content: contentParts.join("｜").trim() };
    }).filter(item => item.title && item.content)
    : tipText.split(/\n+/).filter(Boolean).map((content, index) => ({
      title: ["今日短評", "整體運勢", "愛情運勢", "事業運勢", "財運運勢"][index] || "今日提醒",
      content
    }));
  const overallScore = Number(horoscopeData.overall || 3);

  return `
    <div class="horoscope-box">
      <div class="horoscope-head">
        <div class="zodiac-avatar">${escapeText(horoscopeData.symbol || "✦")}</div>
        <div class="zodiac-meta">
          <h3>${escapeText(horoscopeData.sign || horoscopeData.zodiac || "你的星座")}</h3>
          <div class="star-line">${renderStars(overallScore)}</div>
          <div class="muted-copy">依照你的設定顯示今日提醒</div>
        </div>
      </div>
      <div class="score-grid">
        <div class="score-row"><span>整體</span><span>${renderStars(horoscopeData.overall || 3)}</span></div>
        <div class="score-row"><span>愛情</span><span>${renderStars(horoscopeData.love || 3)}</span></div>
        <div class="score-row"><span>事業</span><span>${renderStars(horoscopeData.career || 3)}</span></div>
        <div class="score-row"><span>財運</span><span>${renderStars(horoscopeData.wealth || 3)}</span></div>
      </div>
      <div class="tip-box">
        ${tipSections.map(item => `
          <section class="horoscope-tip-section">
            <h4>${escapeText(item.title)}</h4>
            <p>${escapeText(item.content)}</p>
          </section>
        `).join("")}
      </div>
    </div>
  `;
}

export function renderWeatherPanel(weatherData) {
  if (!weatherData || weatherData.length === 0) {
    return `<div class="weather-card"><div class="empty-state compact">尚未載入天氣資料</div></div>`;
  }

  return `
    <div class="weather-card">
      <table class="weather-table">
        <thead>
          <tr><th>地區</th><th>天氣</th><th>溫度</th><th>降雨</th></tr>
        </thead>
        <tbody>
          ${weatherData.map(row => `
            <tr>
              <td>${escapeText(row.area)}</td>
              <td>${escapeText(row.weather)}</td>
              <td>${escapeText(row.temp)}</td>
              <td>${escapeText(row.rain || "--")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

export function renderPreferenceHints() {
  if (!state.prefs) {
    return `
      <div class="pref-hint">
        <span class="hint-pill">尚未設定個人偏好</span>
        <span class="hint-pill">先看熱門新聞，也可以稍後設定</span>
      </div>
    `;
  }

  return `
    <div class="pref-hint">
      <span class="hint-pill">興趣：${escapeText(state.prefs.interests.join("、") || "未設定")}</span>
      <span class="hint-pill">關注縣市：${escapeText(state.prefs.region || "未設定")}</span>
      <span class="hint-pill">星座：${escapeText(state.prefs.zodiac || "未設定")}</span>
    </div>
  `;
}

export function renderDiscoveryBar({ showTags = true, mode = "news" } = {}) {
  const searchValue = mode === "favorites" ? state.favoriteSearchQuery : state.searchQuery;
  const searchAttr = mode === "favorites" ? "data-favorite-search-input" : "data-search-input";
  const interestOptions = ["全部", ...(state.prefs?.interests?.length ? state.prefs.interests : INTERESTS.slice(0, 6))];

  return `
    <section class="discovery-bar ${showTags ? "" : "search-only"}" aria-label="新聞搜尋與篩選">
      ${showTags ? `
        <div class="interest-strip">
          ${interestOptions.map(item => `
            <button class="chip ${state.activeInterestFilter === item ? "active" : ""}" data-interest-filter="${escapeText(item)}">${escapeText(item)}</button>
          `).join("")}
        </div>
      ` : `<div></div>`}
      <label class="search-box">
        <span aria-hidden="true">⌕</span>
        <input type="search" value="${escapeText(searchValue)}" placeholder="搜尋標題、摘要、分類或地區" ${searchAttr}>
      </label>
    </section>
  `;
}

export function renderFavoriteDiscovery(categories) {
  return `
    <section class="discovery-bar" aria-label="收藏搜尋與篩選">
      <div class="interest-strip">
        ${categories.map(item => `
          <button class="chip ${state.favoriteFilter === item ? "active" : ""}" data-favorite-filter="${escapeText(item)}">${escapeText(item)}</button>
        `).join("")}
      </div>
      <label class="search-box">
        <span aria-hidden="true">⌕</span>
        <input type="search" value="${escapeText(state.favoriteSearchQuery)}" placeholder="搜尋收藏新聞" data-favorite-search-input>
      </label>
    </section>
  `;
}

export function renderPagination(totalItems) {
  const pageCount = getPageCount(totalItems);
  if (pageCount <= 1) return "";

  return `
    <nav class="pagination" aria-label="新聞分頁">
      ${Array.from({ length: pageCount }, (_, index) => {
        const page = index + 1;
        return `<button class="page-btn ${state.currentPage === page ? "active" : ""}" data-page="${page}">${page}</button>`;
      }).join("")}
    </nav>
  `;
}

export function renderWelcomePage() {
  const slides = [
    {
      subtitle: "歡迎來到新聞小助手",
      image: "../welcome-slide1.png"
    },
    {
      subtitle: "用更清楚的入口，整理你關心的新聞、地區天氣與每日星座。",
      image: "../welcome-slide2.png"
    },
    {
      subtitle: "讓每次打開網站，都先看到你真正想看的內容。",
      image: "../welcome-slide3.png"
    }
  ];

  return `
    <div class="onboard-shell welcome-shell">
      <section class="onboard-card welcome-card">
        <div class="welcome-slider" aria-label="歡迎介紹">
          <div class="slide-track">
            ${slides.map((slide, slideIndex) => `
              <article class="welcome-slide" style="--welcome-bg: url('${escapeText(slide.image)}')">
                <div class="welcome-copy-mask">
                  <p class="welcome-text">
                    ${[...slide.subtitle].map((char, charIndex) => `
                      <span style="--slide-delay: ${slideIndex * 5}s; --char-delay: ${charIndex * 0.055}s;">${char === " " ? "&nbsp;" : escapeText(char)}</span>
                    `).join("")}
                  </p>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
        <div class="slide-dots" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="welcome-actions">
          <button class="btn secondary" data-action="skip-setup">先看熱門新聞</button>
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
        <h2 class="wizard-title">先選出你想追蹤的新聞主題</h2>
        <div class="option-grid interest-grid">
          ${INTERESTS.map(item => `
            <button class="option-btn interest-option ${state.tempPrefs.interests.includes(item) ? "selected" : ""}" style="--interest-bg: url('${escapeText(INTEREST_IMAGES[item] || "")}')" data-interest="${item}">
              <span>${escapeText(item)}</span>
            </button>
          `).join("")}
        </div>
        <div class="subtle-note">至少選擇 1 個，之後首頁會依照興趣排序。</div>
        <div class="wizard-actions">
          <button class="btn secondary" data-action="cancel-to-welcome">返回</button>
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
        <h2 class="wizard-title">你關注哪個地區的天氣呢?</h2>
        <div class="option-grid city-grid">
          ${REGIONS.map(region => `<button class="option-btn ${state.tempPrefs.region === region ? "selected" : ""}" data-region="${region}">${region}</button>`).join("")}
        </div>
        <div class="subtle-note">這會用於縣市天氣資訊。</div>
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
        <h2 class="wizard-title">選擇你的星座，每天進來就能看到專屬運勢!</h2>
        <div class="option-grid zodiac-grid">
          ${ZODIACS.map(item => `
            <button class="option-btn zodiac-option ${state.tempPrefs.zodiac === item ? "selected" : ""}" data-zodiac="${item}">
              <span class="zodiac-option-icon">${ZODIAC_ICONS[item]}</span>
              <span>${item}</span>
            </button>
          `).join("")}
        </div>
        <div class="wizard-actions">
          <button class="btn secondary" data-action="back-step-2">上一步</button>
          <button class="btn primary" data-action="finish-setup">完成設定</button>
        </div>
      </section>
    </div>
  `;
}

export function renderNewsGrid(newsList, size = "medium") {
  const pageItems = getPageItems(newsList);
  return `
    <section class="cards-grid">
      ${pageItems.map(item => `<div class="panel popular-card">${renderNewsCard(item, size)}</div>`).join("")}
    </section>
    ${renderPagination(newsList.length)}
  `;
}

export function renderFeaturedCarousel(newsList) {
  if (!newsList.length) return "";

  const activeIndex = ((state.featuredIndex % newsList.length) + newsList.length) % newsList.length;
  const news = newsList[activeIndex];
  const imgUrl = getNewsImageUrl(news);
  const fallbackImgUrl = INTEREST_IMAGES[news?.category] || "news-background-2.png";
  const timeStr = news.published_at ? String(news.published_at).substring(0, 10) : "尚無日期";

  return `
    <section class="featured-carousel panel" aria-label="推薦焦點新聞">
      <article class="featured-slide clickable" data-open-news="${news.id}">
        <div class="featured-image">
          <img src="${escapeText(imgUrl)}" alt="${escapeText(news.title || "新聞圖片")}" onerror="this.onerror=null;this.src='${escapeText(fallbackImgUrl)}';">
          <div class="featured-nav" aria-hidden="true">
            <button class="featured-arrow" data-featured-prev aria-label="上一則新聞">‹</button>
            <button class="featured-arrow" data-featured-next aria-label="下一則新聞">›</button>
          </div>
        </div>
        <div class="featured-content">
          <div class="tag-row">
            <span class="tag">${escapeText(news.category || "未分類")}</span>
          </div>
          <h2 class="featured-title">${escapeText(news.title || "未命名新聞")}</h2>
          <p class="featured-summary">${escapeText(news.summary || "目前沒有摘要內容。")}</p>
          <div class="card-footer">
            <span>${timeStr}</span>
            <span>${escapeText(news.source || "新聞來源")}</span>
          </div>
        </div>
      </article>
    </section>
  `;
}

export function renderHomePage(newsList, weatherData, horoscopeData) {
  const isSearching = Boolean(String(state.searchQuery || "").trim());
  const carouselNews = state.prefs?.interests?.length
    ? newsList.filter(item => state.prefs.interests.includes(item.category))
    : newsList;
  const featuredSource = carouselNews.slice(0, 5);
  const featuredIds = new Set(featuredSource.map(item => Number(item.id)));
  const remainingNews = newsList.filter(item => !featuredIds.has(Number(item.id)));

  return `
    <div class="app-shell home-shell">
      ${renderNav("home")}
      <main>
      
        ${renderDiscoveryBar({ showTags: true })}
        ${isSearching ? `
          <section class="home-search-results">
            ${newsList.length ? renderNewsGrid(newsList) : `<div class="empty-state">目前沒有符合條件的新聞。</div>`}
          </section>
        ` : `
          <div class="home-feature-layout">
            <div id="carousel-container" style="width: 100%; height: 100%; min-width: 0;">
              ${featuredSource.length ? renderFeaturedCarousel(featuredSource) : `<div class="empty-state">目前沒有符合條件的新聞。</div>`}
            </div>
            <aside class="home-sidebar" aria-label="首頁資訊">
              <section class="panel weather-wrap">${renderWeatherPanel(weatherData)}</section>
              <section class="panel horoscope-wrap">${renderHoroscopePanel(horoscopeData)}</section>
            </aside>
          </div>
          ${remainingNews.length ? renderNewsGrid(remainingNews) : ""}
        `}
      </main>
    </div>
  `;
}

export function renderPopularPage(popularNews) {
  return `
    <div class="app-shell">
      ${renderNav("popular")}
      <main>
        <div class="page-heading-row">
          <h2 class="section-title">熱門新聞</h2>
          <div class="heading-search">
            ${renderDiscoveryBar({ showTags: false })}
          </div>
        </div>
        ${popularNews.length ? renderNewsGrid(popularNews) : `<div class="empty-state">目前沒有符合條件的熱門新聞。</div>`}
      </main>
    </div>
  `;
}

export function renderFavoritesPage(favoriteNews, filteredNews, categories) {
  return `
    <div class="app-shell">
      ${renderNav("favorites")}
      <main>
        <div class="page-heading-row">
          <div class="title-with-tags">
            <h2 class="section-title">收藏新聞</h2>
            <div class="heading-tags">
              ${categories.map(item => `
                <button class="chip ${state.favoriteFilter === item ? "active" : ""}" data-favorite-filter="${escapeText(item)}">${escapeText(item)}</button>
              `).join("")}
            </div>
          </div>
          <label class="search-box heading-search-box">
            <span aria-hidden="true">⌕</span>
            <input type="search" value="${escapeText(state.favoriteSearchQuery)}" placeholder="搜尋收藏新聞" data-favorite-search-input>
          </label>
        </div>
        ${!favoriteNews.length
          ? `<div class="empty-state">還沒有收藏新聞。回到首頁點選愛心，就能把文章留起來。</div>`
          : filteredNews.length
            ? renderNewsGrid(filteredNews)
            : `<div class="empty-state">目前沒有符合條件的收藏新聞。</div>`}
      </main>
    </div>
  `;
}

export function renderDetailPage(allNews) {
  const news = allNews.find(item => Number(item.id) === Number(state.currentDetailId));
  if (!news) return `<div class="app-shell">${renderNav(state.lastMainView)}<main><div class="empty-state">找不到這則新聞。</div></main></div>`;

  const imgUrl = getNewsImageUrl(news);
  const fallbackImgUrl = INTEREST_IMAGES[news?.category] || "news-background-2.png";
  const timeStr = news.published_at ? String(news.published_at).substring(0, 10) : "";
  const summaryText = news.summary || "目前沒有摘要內容。";
  const sourceUrl = news.source_url || "";

  return `
    <div class="app-shell">
      ${renderNav(state.lastMainView)}
      <main>
        <button class="back-link" data-route="${state.lastMainView}">← 回到上一頁</button>
        <section class="detail-panel panel">
          <div class="detail-header">
            <h1 class="detail-title">${escapeText(news.title || "未命名新聞")}</h1>
            <div class="detail-actions">
              ${renderFavoriteButton(news.id)}
              <button class="icon-btn" data-share="${news.id}" aria-label="分享新聞">↗</button>
            </div>
          </div>
          <div class="detail-meta">
            <span class="tag">${escapeText(news.category || "未分類")}</span>
            <span>${timeStr}</span>
          </div>
          <div class="detail-image"><img src="${escapeText(imgUrl)}" alt="${escapeText(news.title || "新聞圖片")}" onerror="this.onerror=null;this.src='${escapeText(fallbackImgUrl)}';"></div>
          <div class="detail-content">
            <p>${escapeText(summaryText)}</p>
            ${sourceUrl ? `<a class="btn primary" href="${escapeText(sourceUrl)}" target="_blank" rel="noopener noreferrer">查看完整內文</a>` : ""}
          </div>
        </section>
      </main>
    </div>
  `;
}

export function renderLoginPage() {
  return `
    <div class="app-shell">
      ${renderNav("login")}
      <main class="auth-main">
        <section class="auth-panel auth-card">
          <input class="auth-tab-radio" type="radio" id="auth-tab-login" name="auth-mode" checked>
          <input class="auth-tab-radio" type="radio" id="auth-tab-signup" name="auth-mode">

          <div class="auth-tabs" aria-label="登入或註冊">
            <label for="auth-tab-login">Log In</label>
            <label for="auth-tab-signup">Sign Up</label>
          </div>

          <form class="auth-form auth-login-form" data-login-form>
            <label>
              <span>✉ Email address</span>
              <input type="email" name="email" placeholder="you@company.com" required>
            </label>

            <label>
              <span>🔒 Password</span>
              <input type="password" name="password" placeholder="********" required>
            </label>

            <button class="auth-submit" type="submit">Log In →</button>
          </form>

          <form class="auth-form auth-signup-form" data-register-form>
            <label>
              <span>♙ Full name</span>
              <input type="text" name="name" placeholder="Jane Smith" required>
            </label>

            <label>
              <span>✉ Work email</span>
              <input type="email" name="email" placeholder="you@company.com" required>
            </label>

            <label>
              <span>🔒 Password</span>
              <input type="password" name="password" placeholder="Min. 8 characters" required>
            </label>

            <label>
              <span>🔒 Confirm Password</span>
              <input type="password" name="confirm_password" placeholder="Confirm password" required>
            </label>

            <button class="auth-submit" type="submit">Create account →</button>
          </form>
        </section>
      </main>
    </div>
  `;
}

export function renderSettingsPage() {
  const aiSummaryEnabled = Boolean(state.crawlerSettings.ai_news_summary);
  return `
    <div class="app-shell">
      ${renderNav("settings")}
      <main>
        <section class="panel placeholder-panel">
          <p class="eyebrow">Preferences</p>
          <h1>個性化設定</h1>
          <div class="settings-row">
            <button
              class="summary-toggle ${aiSummaryEnabled ? "active" : ""}"
              type="button"
              data-action="toggle-ai-summary"
              aria-pressed="${aiSummaryEnabled}"
            >
              <span>新聞詳細內文ai摘要</span>
              <i aria-hidden="true"></i>
            </button>
          </div>
        </section>
      </main>
    </div>
  `;
}
