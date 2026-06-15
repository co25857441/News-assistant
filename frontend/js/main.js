import { state, setOnboarded, setPrefs, setFavorites, setFavoriteItems, setReadNews, setCrawlerSettings, setUser, setAuthRedirectAfterLogin } from "./store.js";
import {
  addBookmark,
  fetchNews,
  fetchUserBookmarks,
  fetchUserPrefs,
  fetchWeather,
  fetchHoroscope,
  fetchSettings,
  removeBookmark,
  updateAiSummarySetting,
  updateUserPrefs
} from "./api.js";
import * as UI from "./ui.js";

let dynamicData = {
  news: [],
  weather: [],
  horoscope: null
};

function getPopularNews() {
  return dynamicData.news
    .filter(item => item.category === "熱門")
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

function getRankedNews() {
  return [...dynamicData.news].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function itemMatchesKeyword(item, keyword) {
  if (!keyword) return true;
  return [item.title, item.summary, item.category, item.region]
    .map(normalize)
    .some(value => value.includes(keyword));
}

function matchesSearch(item) {
  return itemMatchesKeyword(item, normalize(state.searchQuery));
}

function matchesFavoriteSearch(item) {
  return itemMatchesKeyword(item, normalize(state.favoriteSearchQuery));
}

function matchesInterest(item) {
  if (!state.activeInterestFilter || state.activeInterestFilter === "全部") return true;
  return item.category === state.activeInterestFilter;
}

function applyDiscoveryFilters(newsList) {
  return newsList.filter(item => matchesSearch(item) && matchesInterest(item));
}

function getCombinedNews() {
  const items = new Map();
  state.favoriteItems.forEach(item => items.set(Number(item.id), item));
  dynamicData.news.forEach(item => items.set(Number(item.id), item));
  return [...items.values()];
}

function findNewsById(id) {
  return getCombinedNews().find(item => Number(item.id) === Number(id));
}

function getRecommendedNews() {
  const base = getRankedNews();
  if (!state.prefs?.interests?.length) return applyDiscoveryFilters(base);

  const { interests, region } = state.prefs;
  const interestMatched = base.filter(item => interests.includes(item.category));
  const ranked = interestMatched.map(item => ({
    ...item,
    score:
      (item.popularity || 0) +
      (interests.includes(item.category) ? 200 : 0) +
      (region && item.region === region ? 80 : 0)
  })).sort((a, b) => b.score - a.score);

  return applyDiscoveryFilters(ranked);
}

function getFavoriteData() {
  const newsById = new Map(getCombinedNews().map(item => [Number(item.id), item]));
  const favoriteNews = state.favorites
    .map(id => newsById.get(Number(id)))
    .filter(Boolean);
  const categories = ["全部", ...new Set(favoriteNews.map(item => item.category).filter(Boolean))];
  const filtered = favoriteNews.filter(item => {
    const categoryMatch = state.favoriteFilter === "全部" || item.category === state.favoriteFilter;
    return categoryMatch && matchesFavoriteSearch(item);
  });
  return { favoriteNews, filtered, categories };
}

function showView(view) {
  if (["home", "popular", "favorites"].includes(view)) state.lastMainView = view;
  if (state.currentView !== view) state.currentPage = 1;
  state.currentView = view;
  renderApp();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openDetail(id) {
  const newsId = Number(id);
  state.currentDetailId = newsId;
  if (!state.readNews.map(Number).includes(newsId)) {
    setReadNews([...state.readNews.map(Number), newsId]);
  }
  showView("detail");
}

function updateCarouselDOM() {
  if (state.currentView !== "home") return;
  const container = document.getElementById("carousel-container");
  if (!container) return;

  const newsList = getRecommendedNews();
  const carouselNews = state.prefs?.interests?.length
    ? newsList.filter(item => state.prefs.interests.includes(item.category))
    : newsList;
  const featuredSource = carouselNews.slice(0, 5);

  container.innerHTML = featuredSource.length
    ? UI.renderFeaturedCarousel(featuredSource)
    : `<div class="empty-state">目前沒有符合條件的新聞。</div>`;
}

function renderApp({ animateReveal = true } = {}) {
  const app = document.getElementById("app");
  const favoriteData = getFavoriteData();
  const views = {
    welcome: () => UI.renderWelcomePage(),
    step1: () => UI.renderStep1(),
    step2: () => UI.renderStep2(),
    step3: () => UI.renderStep3(),
    home: () => UI.renderHomePage(getRecommendedNews(), dynamicData.weather, dynamicData.horoscope),
    popular: () => UI.renderPopularPage(getPopularNews().filter(matchesSearch)),
    favorites: () => UI.renderFavoritesPage(favoriteData.favoriteNews, favoriteData.filtered, favoriteData.categories),
    detail: () => UI.renderDetailPage(getCombinedNews()),
    login: () => UI.renderLoginPage(),
    settings: () => UI.renderSettingsPage()
  };

  app.innerHTML = (views[state.currentView] || views.welcome)();
  if (animateReveal) {
    observeRevealCards();
  } else {
    document.querySelectorAll(".reveal-card").forEach(card => card.classList.add("is-visible"));
  }
}

function renderSearchResults(selector, cursorPosition) {
  renderApp();
  const nextInput = document.querySelector(selector);
  if (nextInput) {
    nextInput.focus();
    nextInput.setSelectionRange(cursorPosition, cursorPosition);
  }
}

function refreshFavoriteButtons(newsId) {
  const isFav = state.favorites.map(Number).includes(Number(newsId));
  document.querySelectorAll(`[data-fav="${newsId}"]`).forEach(button => {
    button.classList.toggle("active", isFav);
    button.textContent = isFav ? "♥" : "♡";
  });
}

let revealObserver = null;

function observeRevealCards() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal-card").forEach(card => card.classList.add("is-visible"));
    return;
  }

  revealObserver?.disconnect();
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll(".reveal-card").forEach(card => revealObserver.observe(card));
}

async function syncUserData() {
  if (!state.user) return;

  const [prefs, bookmarks] = await Promise.all([
    fetchUserPrefs(),
    fetchUserBookmarks()
  ]);

  if (prefs) {
    setPrefs(prefs, { persist: false });
    if ("ai_news_summary" in prefs) {
      setCrawlerSettings({ ai_news_summary: Boolean(prefs.ai_news_summary) });
    }
  }

  setFavorites(bookmarks.map(item => Number(item.id)), { persist: false });
  setFavoriteItems(bookmarks, { persist: false });
}

async function toggleFavorite(id) {
  if (!state.user) {
    alert("請先登入以使用收藏功能！");
    setAuthRedirectAfterLogin(state.currentView);
    showView("login");
    return;
  }

  const set = new Set(state.favorites.map(Number));
  const snapshots = new Map(state.favoriteItems.map(item => [Number(item.id), item]));
  if (set.has(id)) {
    const result = await removeBookmark(id);
    if (!result.success) return alert(result.message || "移除收藏失敗");
    set.delete(id);
    snapshots.delete(id);
  } else {
    const news = findNewsById(id);
    const result = await addBookmark(id);
    if (!result.success) return alert(result.message || "新增收藏失敗");
    set.add(id);
    if (news) snapshots.set(id, news);
  }
  setFavorites([...set], { persist: false });
  setFavoriteItems([...snapshots.values()], { persist: false });
  if (state.currentView === "favorites") {
    renderApp({ animateReveal: false });
  } else {
    refreshFavoriteButtons(id);
  }
}

async function shareNews(newsId) {
  const news = findNewsById(newsId);
  if (!news) return;

  const text = `${news.title}\n${news.summary || ""}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: news.title, text, url: news.source_url });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${text}\n${news.source_url || ""}`);
      alert("已複製新聞連結與摘要。");
    } else {
      alert("目前瀏覽器不支援分享功能。");
    }
  } catch {
    // 使用者取消分享時不需要顯示錯誤。
  }
}

async function loadDynamicWidgets() {
  const prefs = state.prefs || { region: "台灣", zodiac: "牡羊座" };

  const [weather, horoscope] = await Promise.all([
    fetchWeather(prefs.region),
    fetchHoroscope(prefs.zodiac)
  ]);

  dynamicData.weather = weather;
  dynamicData.horoscope = horoscope;
}

document.addEventListener("click", async (event) => {
  const favEl = event.target.closest("[data-fav]");
  if (favEl) {
    event.stopPropagation();
    return toggleFavorite(Number(favEl.dataset.fav));
  }

  const shareEl = event.target.closest("[data-share]");
  if (shareEl) {
    event.stopPropagation();
    return shareNews(shareEl.dataset.share);
  }

  const featuredPrevEl = event.target.closest("[data-featured-prev]");
  if (featuredPrevEl) {
    event.stopPropagation();
    state.featuredIndex -= 1;
    return updateCarouselDOM();
  }

  const featuredNextEl = event.target.closest("[data-featured-next]");
  if (featuredNextEl) {
    event.stopPropagation();
    state.featuredIndex += 1;
    return updateCarouselDOM();
  }

  const routeEl = event.target.closest("[data-route]");
  if (routeEl) {
    setAuthRedirectAfterLogin(null);
    return showView(routeEl.dataset.route);
  }

  const openNewsEl = event.target.closest("[data-open-news]");
  if (openNewsEl) return openDetail(openNewsEl.dataset.openNews);

  const favoriteFilterEl = event.target.closest("[data-favorite-filter]");
  if (favoriteFilterEl) {
    state.favoriteFilter = favoriteFilterEl.dataset.favoriteFilter;
    state.currentPage = 1;
    return renderApp();
  }

  const interestFilterEl = event.target.closest("[data-interest-filter]");
  if (interestFilterEl) {
    state.activeInterestFilter = interestFilterEl.dataset.interestFilter;
    state.currentPage = 1;
    state.featuredIndex = Math.floor(Math.random() * Math.max(1, getRecommendedNews().length));
    return renderApp();
  }

  const pageEl = event.target.closest("[data-page]");
  if (pageEl) {
    state.currentPage = Number(pageEl.dataset.page);
    const shouldStayNearHomeList = state.currentView === "home";
    renderApp();
    const target = shouldStayNearHomeList ? document.querySelector(".cards-grid") : null;
    return target
      ? target.scrollIntoView({ behavior: "smooth", block: "start" })
      : window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const interestEl = event.target.closest("[data-interest]");
  if (interestEl) {
    const value = interestEl.dataset.interest;
    const set = new Set(state.tempPrefs.interests);
    set.has(value) ? set.delete(value) : set.add(value);
    state.tempPrefs.interests = [...set];
    return renderApp();
  }

  const regionEl = event.target.closest("[data-region]");
  if (regionEl) {
    state.tempPrefs.region = regionEl.dataset.region;
    return renderApp();
  }

  const zodiacEl = event.target.closest("[data-zodiac]");
  if (zodiacEl) {
    state.tempPrefs.zodiac = zodiacEl.dataset.zodiac;
    return renderApp();
  }

  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;

  switch (actionEl.dataset.action) {
    case "start-setup":
    case "restart-setup":
      state.tempPrefs = { interests: [], region: "", zodiac: "" };
      if (!state.user) {
        setAuthRedirectAfterLogin("step1");
        showView("login");
        break;
      }
      showView("step1");
      break;

    case "logout": {
      await fetch("http://127.0.0.1:8000/api/logout", {
        method: "POST",
        credentials: "include"
      });

      setUser(null);
      setAuthRedirectAfterLogin(null);
      alert("已登出");
      showView("login");
      break;
    }

    case "skip-setup":
      setAuthRedirectAfterLogin(null);
      setOnboarded(true);
      setPrefs(null);
      state.activeInterestFilter = "全部";
      showView("home");
      break;

    case "cancel-to-welcome":
      setAuthRedirectAfterLogin(null);
      showView("welcome");
      break;

    case "go-step-2":
      if (!state.tempPrefs.interests.length) return alert("請至少選擇一個興趣。");
      showView("step2");
      break;

    case "back-step-1":
      showView("step1");
      break;

    case "go-step-3":
      if (!state.tempPrefs.region) return alert("請選擇一個台灣縣市。");
      showView("step3");
      break;

    case "back-step-2":
      showView("step2");
      break;

    case "finish-setup":
      if (!state.tempPrefs.zodiac) return alert("請選擇你的星座。");
      const nextPrefs = {
        interests: [...state.tempPrefs.interests],
        region: state.tempPrefs.region,
        zodiac: state.tempPrefs.zodiac,
        ai_news_summary: Boolean(state.crawlerSettings.ai_news_summary)
      };
      if (state.user) {
        const savedPrefs = await updateUserPrefs(nextPrefs);
        if (!savedPrefs) return alert("儲存個人偏好失敗，請稍後再試。");
        setPrefs(savedPrefs, { persist: false });
      } else {
        setPrefs(nextPrefs);
      }
      setOnboarded(true);
      state.activeInterestFilter = "全部";
      await loadDynamicWidgets();
      showView("home");
      break;

    case "login-placeholder":
      alert("登入頁面目前是 UI 版本，尚未串接後端。");
      break;

    case "toggle-ai-summary": {
      const nextEnabled = !state.crawlerSettings.ai_news_summary;
      const nextSettings = await updateAiSummarySetting(nextEnabled);
      setCrawlerSettings(nextSettings);
      if (state.user && state.prefs) {
        setPrefs(
          { ...state.prefs, ai_news_summary: Boolean(nextSettings.ai_news_summary) },
          { persist: false }
        );
      }
      const enabled = Boolean(state.crawlerSettings.ai_news_summary);
      actionEl.classList.toggle("active", enabled);
      actionEl.setAttribute("aria-pressed", String(enabled));
      break;
    }
  }
});

let searchRenderTimer = null;

function scheduleSearchRender(selector, cursorPosition) {
  clearTimeout(searchRenderTimer);
  searchRenderTimer = setTimeout(() => {
    renderSearchResults(selector, cursorPosition);
  }, 120);
}

document.addEventListener("submit", async (event) => {
  const loginForm = event.target.closest("[data-login-form]");
  const registerForm = event.target.closest("[data-register-form]");

  if (loginForm) {
    event.preventDefault();

    const formData = new FormData(loginForm);

    const res = await fetch("http://127.0.0.1:8000/api/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    const data = await res.json();

    if (data.success) {
      setUser(data.user);
      await syncUserData();
      alert("登入成功");
      const nextView = state.authRedirectAfterLogin || "home";
      setAuthRedirectAfterLogin(null);
      showView(nextView);
    } else {
      alert(data.message || "登入失敗");
    }
  }

  if (registerForm) {
    event.preventDefault();

    const formData = new FormData(registerForm);

    const password = formData.get("password");
    const confirmPassword = formData.get("confirm_password");

    if (password !== confirmPassword) {
      alert("兩次密碼不一致");
      return;
    }

    const res = await fetch("http://127.0.0.1:8000/api/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: password
      })
    });

    const data = await res.json();

    if (data.success) {
      alert("註冊成功，請登入");
      document.querySelector("#auth-tab-login").checked = true;
    } else {
      alert(data.message || "註冊失敗");
    }
  }
});

document.addEventListener("input", (event) => {
  const searchInput = event.target.closest("[data-search-input]");
  if (searchInput) {
    if (event.isComposing || searchInput.dataset.composing === "true") return;
    state.searchQuery = searchInput.value;
    state.currentPage = 1;
    return scheduleSearchRender("[data-search-input]", searchInput.selectionStart || searchInput.value.length);
  }

  const favoriteSearchInput = event.target.closest("[data-favorite-search-input]");
  if (favoriteSearchInput) {
    if (event.isComposing || favoriteSearchInput.dataset.composing === "true") return;
    state.favoriteSearchQuery = favoriteSearchInput.value;
    state.currentPage = 1;
    return scheduleSearchRender("[data-favorite-search-input]", favoriteSearchInput.selectionStart || favoriteSearchInput.value.length);
  }
});

document.addEventListener("compositionstart", (event) => {
  const input = event.target.closest("[data-search-input], [data-favorite-search-input]");
  if (input) input.dataset.composing = "true";
});

document.addEventListener("compositionend", (event) => {
  const searchInput = event.target.closest("[data-search-input]");
  if (searchInput) {
    searchInput.dataset.composing = "false";
    state.searchQuery = searchInput.value;
    state.currentPage = 1;
    return renderSearchResults("[data-search-input]", searchInput.selectionStart || searchInput.value.length);
  }

  const favoriteSearchInput = event.target.closest("[data-favorite-search-input]");
  if (favoriteSearchInput) {
    favoriteSearchInput.dataset.composing = "false";
    state.favoriteSearchQuery = favoriteSearchInput.value;
    state.currentPage = 1;
    return renderSearchResults("[data-favorite-search-input]", favoriteSearchInput.selectionStart || favoriteSearchInput.value.length);
  }
});

document.addEventListener("mousemove", (event) => {
  const card = event.target.closest(".news-card");
  if (!card) return;

  const rect = card.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  card.style.setProperty("--mouse-x", `${x}%`);
  card.style.setProperty("--mouse-y", `${y}%`);
});

async function loadCurrentUser() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/me", {
      credentials: "include"
    });

    const data = await res.json();

    if (data.logged_in) {
      setUser(data.user);
      await syncUserData();
    } else {
      setUser(null);
    }
  } catch (error) {
    console.error(error);
    setUser(null);
  }
}

async function initApp() {
  await loadCurrentUser();

  if (state.onboarded && state.currentView === "welcome") {
    state.currentView = "home";
  }
  
  const initialView = state.currentView;
  renderApp();

  const [apiNews, settings] = await Promise.all([fetchNews(), fetchSettings()]);
  if (!state.user || !state.prefs || !("ai_news_summary" in state.prefs)) {
    setCrawlerSettings(settings);
  }
  dynamicData.news = apiNews;
  if (!state.user) {
    const favoriteSet = new Set(state.favorites.map(Number));
    const snapshots = new Map(state.favoriteItems.map(item => [Number(item.id), item]));
    dynamicData.news.forEach(item => {
      if (favoriteSet.has(Number(item.id))) snapshots.set(Number(item.id), item);
    });
    setFavoriteItems([...snapshots.values()].filter(item => favoriteSet.has(Number(item.id))));
  }
  state.featuredIndex = Math.floor(Math.random() * Math.max(1, dynamicData.news.length));
  await loadDynamicWidgets();
  renderApp({ animateReveal: false });
}

setInterval(() => {
  if (state.currentView !== "home") return;
  if (!document.getElementById("carousel-container")) return;
  state.featuredIndex += 1;
  updateCarouselDOM();
}, 5000);

initApp();
