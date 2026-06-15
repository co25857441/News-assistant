import streamlit as st
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# 設定網頁標題與佈局
st.set_page_config(page_title="新聞與星座觀測站", layout="wide")

# 新聞分類網址
CATEGORY_URLS = {
    "熱門": "https://news.ltn.com.tw/list/breakingnews/popular",
    "政治": "https://news.ltn.com.tw/list/breakingnews/politics",
    "軍武": "https://def.ltn.com.tw/",
    "社會": "https://news.ltn.com.tw/list/breakingnews/society",
    "生活": "https://news.ltn.com.tw/list/breakingnews/life",
    "健康": "https://health.ltn.com.tw/",
    "國際": "https://news.ltn.com.tw/list/breakingnews/world",
    "地方": "https://news.ltn.com.tw/list/breakingnews/local",
    "蒐奇": "https://news.ltn.com.tw/list/breakingnews/novelty",
    "影音": "https://video.ltn.com.tw/",
    "財經": "https://ec.ltn.com.tw/",
    "娛樂": "https://ent.ltn.com.tw/",
    "汽車": "https://auto.ltn.com.tw/",
    "時尚": "https://istyle.ltn.com.tw/",
    "體育": "https://sports.ltn.com.tw/",
    "3C": "https://3c.ltn.com.tw/",
    "評論": "https://talk.ltn.com.tw/",
    "藝文": "https://art.ltn.com.tw/",
    "玩咖": "https://playing.ltn.com.tw/",
    "食譜": "https://food.ltn.com.tw/",
    "地產": "https://estate.ltn.com.tw/",
}

# 科技紫微網每日運勢對應的 iAstro 編號
HOROSCOPE_URLS = {
    "牡羊座 (Aries)": "https://www.cosmopolitan.com/tw/horoscopes/today/a32681177/aries-today/",
    "金牛座 (Taurus)": "https://www.cosmopolitan.com/tw/horoscopes/today/a32682953/taurus-today/",
    "雙子座 (Gemini)": "https://www.cosmopolitan.com/tw/horoscopes/today/a32682972/gemini-today/",
    "巨蟹座 (Cancer)": "https://www.cosmopolitan.com/tw/horoscopes/today/a32682992/cancer-today/",
    "獅子座 (Leo)": "https://www.cosmopolitan.com/tw/horoscopes/today/a32683022/leo-today/",
    "處女座 (Virgo)": "https://www.cosmopolitan.com/tw/horoscopes/today/a32683069/virgo-today/",
    "天秤座 (Libra)": "https://www.cosmopolitan.com/tw/horoscopes/today/a32683119/libra-today/",
    "天蠍座 (Scorpio)": "https://www.cosmopolitan.com/tw/horoscopes/today/a32683141/scorpio-today/",
    "射手座 (Sagittarius)": "https://www.cosmopolitan.com/tw/horoscopes/today/a32683171/sagittarius-today/",
    "摩羯座 (Capricorn)": "https://www.cosmopolitan.com/tw/horoscopes/today/a32683204/capricorn-today/",
    "水瓶座 (Aquarius)": "https://www.cosmopolitan.com/tw/horoscopes/today/a32683235/aquarius-today/",
    "雙魚座 (Pisces)": "https://www.cosmopolitan.com/tw/horoscopes/today/a32683250/pisces-today/",
}

# 基礎 HTTP 請求函數
def fetch_html(url):
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }

    response = requests.get(url, headers=headers, timeout=10)

    if response.status_code != 200:
        raise Exception(f"網頁讀取失敗，HTTP 狀態碼：{response.status_code}")

    # 不要固定寫 utf-8，讓 requests 自己判斷
    response.encoding = response.apparent_encoding

    return response.text

# 新聞解析邏輯
def is_valid_news_url(url):  #0614 Teddy add
    parsed = urlparse(url)
    path = parsed.path.rstrip("/")
    lower_path = path.lower()
    if "/list/" in lower_path or "/live/" in lower_path:
        return False
    if any(keyword in lower_path for keyword in ["/privacy", "/service", "/contact", "/about", "/app", "/search", "/member"]):
        return False
    return bool(re.search(r"\d$", path))

def parse_ltn_news(html, base_url):
    soup = BeautifulSoup(html, "html.parser")
    news_list = []

    #0614 Teddy add: 先抓標準新聞列表頁，再用 URL 規則處理子網域 fallback。
    for tag in soup.select("ul.list li a.tit"):
        title = tag.get_text(strip=True)
        link = tag.get("href")
        full_url = urljoin(base_url, link or "")
        if title and link and is_valid_news_url(full_url):
            news_list.append((title, full_url))

    if not news_list:
        #0614 Teddy add: 子網域版型差異大，fallback 掃全頁連結，再交給 is_valid_news_url 過濾。
        # for tag in soup.select("a"):
        #     title = tag.get_text(strip=True)
        #     link = tag.get("href")
        #     if not title or not link or len(title) < 8 or "ltn.com.tw" not in urljoin(base_url, link):
        #         continue
        #     item = (title, urljoin(base_url, link))
        #     if item not in news_list:
        #         news_list.append(item)
        title_blacklist = [
            "APP下載", "服務條款", "隱私權", "聯絡我們", "關於我們", "著作權",
            "more", "More", "影音", "總覽", "會員", "訂閱", "廣告", "活動"
        ]
        for tag in soup.select("a"):
            title_tag = tag.select_one("h1, h2, h3, h4, .title, .tit, .news_title")
            title = (
                title_tag.get_text(" ", strip=True)
                if title_tag
                else tag.get("title") or tag.get_text(" ", strip=True)
            )
            link = tag.get("href")
            full_url = urljoin(base_url, link or "")
            if not title or not link or len(title) < 8:
                continue
            title = re.sub(r"\s+", " ", title).strip()
            if any(keyword in title for keyword in title_blacklist):
                continue
            if len(title) > 80:
                continue
            if "ltn.com.tw" not in full_url or not is_valid_news_url(full_url):
                continue
            item = (title, full_url)
            if item not in news_list:
                news_list.append(item)
    return news_list

# 🔥 修正版：精準抓取科技紫微網結構
import re

# 🔥 完整替換 parse_horoscope_v3 函數

import re
from bs4 import BeautifulSoup

def parse_cosmo_horoscope(html):
    soup = BeautifulSoup(html, "html.parser")

    result = {
        "short_comment": "暫無資料",
        "lucky_number": "暫無資料",
        "lucky_color": "暫無資料",
        "lucky_direction": "暫無資料",
        "lucky_match": "暫無資料",
        "lucky_time": "暫無資料",
        "overall_text": "暫無資料",
        "love_text": "暫無資料",
        "career_text": "暫無資料",
        "wealth_text": "暫無資料",
        "overall_score": 3,
        "love_score": 3,
        "career_score": 3,
        "wealth_score": 3,
    }

    # 取得整頁文字
    text = soup.get_text("\n", strip=True)

    # 清掉太多空白行
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    clean_text = "\n".join(lines)

    def extract_one(label):
        """
        抓取像這種格式：
        今日短評：心情愉快
        幸運數字：6
        幸運顏色：蘋果綠
        """
        pattern = rf"{label}\s*[：:]\s*([^\n]+)"
        match = re.search(pattern, clean_text)
        if match:
            return match.group(1).strip()
        return "暫無資料"

    def extract_section(title, next_titles):
        """
        抓取段落，例如：
        整體運勢
        文字文字文字
        愛情運勢
        ...
        """
        next_pattern = "|".join([re.escape(t) for t in next_titles])
        pattern = rf"{re.escape(title)}\s*\n+(.*?)(?=\n(?:{next_pattern})\n|\Z)"
        match = re.search(pattern, clean_text, re.S)

        if not match:
            return "暫無資料"

        content = match.group(1).strip()

        # 移除星星圖片替代文字、延伸閱讀等雜訊
        remove_keywords = [
            "Image:",
            "Star Fill",
            "Star",
            "延伸閱讀",
            "ADVERTISEMENT",
            "繼續閱讀",
            "LINE@",
            "立即加好友",
            "看更多",
            "加入柯夢波丹",
        ]
        remove_patterns = [
            r"^【八字】",
            r"^【日本命理】",
            r"^♥?加入柯夢波丹LINE@",
            r"^看更多.+座運勢$",
        ]

        content_lines = []
        for line in content.split("\n"):
            line = line.strip()
            if not line:
                continue

            if any(key in line for key in remove_keywords):
                continue
            if any(re.search(pattern, line) for pattern in remove_patterns):
                continue

            # 過短且像雜訊的行略過
            if line in ["今日運勢", "星座運勢", "今日提醒"]:
                continue

            content_lines.append(line)

        return "\n".join(content_lines).strip() if content_lines else "暫無資料"

    def extract_score_from_markup(title, next_titles):
        heading_text = soup.find(string=lambda value: value and title in value.strip())
        if not heading_text or not getattr(heading_text, "parent", None):
            return 0

        score = 0
        for node in heading_text.parent.next_elements:
            if isinstance(node, str):
                text_value = node.strip()
                if not text_value or text_value == title:
                    continue
                if score and any(next_title == text_value for next_title in next_titles if next_title != title):
                    break
                score += text_value.count("Star Fill")
                if score and "Star" not in text_value and len(text_value) > 8:
                    break
            elif getattr(node, "name", None):
                label = " ".join(
                    str(node.get(attr, ""))
                    for attr in ("alt", "aria-label", "title", "src", "class")
                ).lower()
                if "star fill" in label:
                    score += 1
                if score >= 5:
                    break

        return min(5, score)

    def extract_score(title, next_titles):
        markup_score = extract_score_from_markup(title, next_titles)
        if markup_score:
            return min(5, max(1, markup_score))

        next_pattern = "|".join([re.escape(t) for t in next_titles])
        pattern = rf"{re.escape(title)}\s*\n+(.*?)(?=\n(?:{next_pattern})\n|\Z)"
        match = re.search(pattern, clean_text, re.S)
        if not match:
            return 3

        section_lines = [line.strip() for line in match.group(1).split("\n") if line.strip()]
        score = 0
        for line in section_lines[:8]:
            if "Star Fill" in line:
                score += line.count("Star Fill")
            elif line in {"★", "星"}:
                score += 1
            elif "Star" not in line and score:
                break

        return min(5, max(1, score or 3))

    # 上方幸運資料
    result["short_comment"] = extract_one("今日短評")
    result["lucky_number"] = extract_one("幸運數字")
    result["lucky_color"] = extract_one("幸運顏色")

    # Cosmopolitan 用的是「開運方位」，不是「幸運方位」
    result["lucky_direction"] = extract_one("開運方位")

    # Cosmopolitan 用的是「今日吉時」，不是「吉時」
    result["lucky_time"] = extract_one("今日吉時")

    # Cosmopolitan 用的是「幸運星座」，不是「速配星座」
    result["lucky_match"] = extract_one("幸運星座")

    section_titles = [
        "整體運勢",
        "愛情運勢",
        "事業運勢",
        "財運運勢",
        "牡羊座明日運勢",
        "金牛座明日運勢",
        "雙子座明日運勢",
        "巨蟹座明日運勢",
        "獅子座明日運勢",
        "處女座明日運勢",
        "天秤座明日運勢",
        "天蠍座明日運勢",
        "射手座明日運勢",
        "摩羯座明日運勢",
        "水瓶座明日運勢",
        "雙魚座明日運勢",
    ]

    result["overall_text"] = extract_section("整體運勢", section_titles)
    result["love_text"] = extract_section("愛情運勢", section_titles)
    result["career_text"] = extract_section("事業運勢", section_titles)
    result["wealth_text"] = extract_section("財運運勢", section_titles)
    result["overall_score"] = extract_score("整體運勢", section_titles)
    result["love_score"] = extract_score("愛情運勢", section_titles)
    result["career_score"] = extract_score("事業運勢", section_titles)
    result["wealth_score"] = extract_score("財運運勢", section_titles)

    return result

# --- Streamlit 前端介面設計已改為寫入現有前端使用的 SQLite ---#0614 Teddy add

import os
import sqlite3
from datetime import datetime

def load_project_env():  
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
    if not os.path.exists(env_path):
        return

    with open(env_path, "r", encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

load_project_env()  

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "data", "news_live.db")

OPENAI_API_URL = "https://api.openai.com/v1/responses" 
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")  

CATEGORY_MAP = {category: category for category in CATEGORY_URLS} 

ZODIAC_SYMBOLS = {
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
    "雙魚座": "♓",
}

WEATHER_LOCATIONS = {
    "台北市": (25.0330, 121.5654),
    "新北市": (25.0169, 121.4628),
    "桃園市": (24.9937, 121.3009),
    "台中市": (24.1477, 120.6736),
    "台南市": (22.9999, 120.2270),
    "高雄市": (22.6273, 120.3014),
    "基隆市": (25.1276, 121.7392),
    "新竹市": (24.8138, 120.9675),
    "嘉義市": (23.4801, 120.4491),
    "新竹縣": (24.8387, 121.0177),
    "苗栗縣": (24.5602, 120.8214),
    "彰化縣": (24.0518, 120.5161),
    "南投縣": (23.9609, 120.9719),
    "雲林縣": (23.7092, 120.4313),
    "嘉義縣": (23.4518, 120.2555),
    "屏東縣": (22.5519, 120.5487),
    "宜蘭縣": (24.7021, 121.7378),
    "花蓮縣": (23.9872, 121.6015),
    "台東縣": (22.7972, 121.0714),
    "澎湖縣": (23.5711, 119.5793),
    "金門縣": (24.4321, 118.3171),
    "連江縣": (26.1608, 119.9517),
}

WEATHER_CODE_LABELS = {
    0: "晴",
    1: "大致晴朗",
    2: "多雲",
    3: "陰",
    45: "有霧",
    48: "有霧",
    51: "毛毛雨",
    53: "毛毛雨",
    55: "毛毛雨",
    61: "短暫雨",
    63: "雨",
    65: "大雨",
    80: "陣雨",
    81: "陣雨",
    82: "強陣雨",
    95: "雷雨",
}

def ensure_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            summary TEXT,
            category TEXT,
            region TEXT,
            source TEXT,
            source_url TEXT UNIQUE,
            image_url TEXT,
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            popularity INTEGER DEFAULT 0
        )
    """)
    cursor.execute("PRAGMA table_info(news)")
    news_columns = {row[1] for row in cursor.fetchall()}
    if "content" not in news_columns:
        cursor.execute("ALTER TABLE news ADD COLUMN content TEXT")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS horoscopes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zodiac TEXT UNIQUE,
            symbol TEXT,
            overall INTEGER,
            love INTEGER,
            career INTEGER,
            wealth INTEGER,
            tip TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("PRAGMA table_info(horoscopes)")
    horoscope_columns = {row[1] for row in cursor.fetchall()}
    for column in ["overall", "love", "career", "wealth"]:
        if column not in horoscope_columns:
            cursor.execute(f"ALTER TABLE horoscopes ADD COLUMN {column} INTEGER")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS weather (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            region TEXT UNIQUE,
            weather TEXT,
            temp TEXT,
            rain TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""  --0614 Teddy add
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    cursor.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
        ("ai_news_summary", "0"),
    )
    conn.commit()
    return conn

def is_ai_summary_enabled(conn):  #0614 Teddy add
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT value FROM settings WHERE key = ?", ("ai_news_summary",))
        row = cursor.fetchone()
    except sqlite3.OperationalError:
        return False
    return bool(row and str(row[0]) == "1")

def normalize_category(category):
    return CATEGORY_MAP.get(category, category)

def normalize_zodiac(label):
    return label.split("(", 1)[0].strip()

def build_summary(title, category):
    return f"{category}新聞快訊：{title}。"

def build_ai_summary(title, category, source_text):  #0614 Teddy add
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key or not source_text:
        return build_summary(title, category)

    prompt = (
        "請用繁體中文替以下新聞產生 3 個條列式重點摘要，"
        "總長度控制在 150 到 250 字內。不要加入原文沒有的資訊。"
    )
    payload = {
        "model": OPENAI_MODEL,
        "input": [
            {
                "role": "system",
                "content": "你是新聞摘要助手，只輸出精簡、客觀的繁體中文條列摘要。"
            },
            {
                "role": "user",
                "content": f"{prompt}\n\n分類：{category}\n標題：{title}\n新聞資訊：{source_text[:900]}"
            }
        ],
        "max_output_tokens": 260,
    }
    try:
        response = requests.post(
            OPENAI_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
        summary = (data.get("output_text") or "").strip()
        if summary:
            return summary
    except Exception as exc:
        print(f"[openai] 摘要失敗，改用備用摘要：{title} ({exc})")
    return build_summary(title, category)

def normalize_article_image(image_url, page_url):
    image_url = (image_url or "").strip()
    if not image_url:
        return ""

    absolute_url = urljoin(page_url, image_url)
    lower_url = absolute_url.lower()
    blocked_keywords = [  #0614 Teddy add
        "logo",
        "banner",
        "ad_",
        "advertisement",
        "apple-touch-icon",
        "app-icon",
        "favicon",
        "footer",
        "header",
        "nav_",
        "avatar",
        "fb_ltn",
        "ltn.png",
        "default",
        "blank",
        "lazy",
        "icon",
        "placeholder",
        "sprite",
    ]
    if any(keyword in lower_url for keyword in blocked_keywords):
        return ""
    if "assets" in lower_url or "dist" in lower_url:
        return ""
    return absolute_url

def parse_article_detail(link):
    try:
        html = fetch_html(link)
    except Exception:
        return {"has_article": False, "image_url": "", "summary_source": ""}

    soup = BeautifulSoup(html, "html.parser")
    image_url = ""

    image_tag = soup.select_one("meta[property='og:image']") or soup.select_one("meta[name='twitter:image']")
    if image_tag:
        image_url = normalize_article_image(image_tag.get("content", ""), link)

    if not image_url:
        for img in soup.select(".photo img, .ph_b img, article img, .news_p img, .content img"):
            candidate = normalize_article_image(img.get("data-src") or img.get("src"), link)
            if candidate:
                image_url = candidate
                break

    description_tag = (
        soup.select_one("meta[property='og:description']")
        or soup.select_one("meta[name='description']")
        or soup.select_one("meta[name='twitter:description']")
    )
    description = description_tag.get("content", "").strip() if description_tag else ""
    page_title = soup.select_one("meta[property='og:title']")
    page_title_text = page_title.get("content", "").strip() if page_title else ""

    return {
        "has_article": bool(soup.select_one(".text, .news_content, article, .content")),
        "image_url": image_url,
        "page_title": page_title_text,
        "summary_source": "。".join(part for part in [page_title_text, description] if part),
    }

def has_article_detail(detail):
    return bool(detail.get("has_article"))

def save_news(conn, category, news_list, use_ai_summary=False):
    cursor = conn.cursor()
    saved = 0
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    valid_news = []  #0614 Teddy add
    for title, link in news_list:  #0614 Teddy add
        detail = parse_article_detail(link)
        if not has_article_detail(detail):
            cursor.execute("DELETE FROM news WHERE source_url = ?", (link,))
            continue
        valid_news.append((title, link, detail))

    for index, (title, link, detail) in enumerate(valid_news[:20], start=1):
        title = detail.get("page_title") or title
        title = re.sub(r"\s+", " ", title).strip()
        title = title.split(" - 自由")[0].strip()
        if len(title) > 80:
            title = title[:80].rstrip()
        image_url = detail["image_url"]
        summary = (
            build_ai_summary(title, category, detail.get("summary_source"))
            if use_ai_summary
            else build_summary(title, category)
        )
        cursor.execute("""
            INSERT OR IGNORE INTO news
            (title, summary, content, category, region, source, source_url, image_url, published_at, popularity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            title,
            summary,
            "",
            normalize_category(category),
            "全台",
            "自由時報",
            link,
            image_url,
            now,
            max(30, 100 - index),
        ))
        if cursor.rowcount == 0:
            cursor.execute("""
                UPDATE news
                SET title = COALESCE(NULLIF(?, ''), title),
                    summary = COALESCE(NULLIF(?, ''), summary),
                    content = '',
                    image_url = COALESCE(NULLIF(?, ''), image_url)
                WHERE source_url = ?
            """, (title, summary, image_url, link))
        saved += cursor.rowcount
    conn.commit()
    return saved

def save_horoscope(conn, zodiac_label, data):
    zodiac = normalize_zodiac(zodiac_label)
    tip_parts = [
        ("今日短評", data.get("short_comment")),
        ("整體運勢", data.get("overall_text")),
        ("愛情運勢", data.get("love_text")),
        ("事業運勢", data.get("career_text")),
        ("財運運勢", data.get("wealth_text")),
    ]
    tip = "\n".join(f"{label}｜{part}" for label, part in tip_parts if part and part != "暫無資料")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO horoscopes (zodiac, symbol, overall, love, career, wealth, tip, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(zodiac) DO UPDATE SET
            symbol = excluded.symbol,
            overall = excluded.overall,
            love = excluded.love,
            career = excluded.career,
            wealth = excluded.wealth,
            tip = excluded.tip,
            updated_at = CURRENT_TIMESTAMP
    """, (
        zodiac,
        ZODIAC_SYMBOLS.get(zodiac, "✦"),
        int(data.get("overall_score") or 3),
        int(data.get("love_score") or 3),
        int(data.get("career_score") or 3),
        int(data.get("wealth_score") or 3),
        tip or "今日運勢資料已更新。",
    ))
    conn.commit()

def weather_code_to_label(code):
    return WEATHER_CODE_LABELS.get(int(code or 0), "天氣變化")

def fetch_weather(region, latitude, longitude):
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={latitude}&longitude={longitude}"
        "&current=temperature_2m,weather_code"
        "&daily=precipitation_probability_max"
        "&timezone=Asia%2FTaipei"
    )
    data = requests.get(url, timeout=10).json()
    current = data.get("current", {})
    daily = data.get("daily", {})
    rain = daily.get("precipitation_probability_max", [0])[0]
    return {
        "region": region,
        "weather": weather_code_to_label(current.get("weather_code")),
        "temp": f"{round(float(current.get('temperature_2m', 0)))}°C",
        "rain": f"{rain}%",
    }

def save_weather(conn, row):
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO weather (region, weather, temp, rain, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(region) DO UPDATE SET
            weather = excluded.weather,
            temp = excluded.temp,
            rain = excluded.rain,
            updated_at = CURRENT_TIMESTAMP
    """, (row["region"], row["weather"], row["temp"], row["rain"]))
    conn.commit()

def crawl_news_to_frontend():
    conn = ensure_db()
    total_saved = 0
    try:
        use_ai_summary = is_ai_summary_enabled(conn)  #0614 Teddy add
        for category, url in CATEGORY_URLS.items():
            html = fetch_html(url)
            news_list = parse_ltn_news(html, url)
            saved = save_news(conn, category, news_list, use_ai_summary)
            total_saved += saved
            print(f"[news] {category}: 讀取 {len(news_list)} 則，新增 {saved} 則")
    finally:
        conn.close()
    return total_saved

def crawl_horoscope_to_frontend():
    conn = ensure_db()
    try:
        for zodiac_label, astro_url in HOROSCOPE_URLS.items():
            astro_html = fetch_html(astro_url)
            data = parse_cosmo_horoscope(astro_html)
            save_horoscope(conn, zodiac_label, data)
            print(f"[horoscope] {normalize_zodiac(zodiac_label)}: 已更新")
    finally:
        conn.close()

def crawl_weather_to_frontend():
    conn = ensure_db()
    try:
        for region, (latitude, longitude) in WEATHER_LOCATIONS.items():
            row = fetch_weather(region, latitude, longitude)
            save_weather(conn, row)
            print(f"[weather] {region}: {row['weather']} {row['temp']} 降雨 {row['rain']}")
    finally:
        conn.close()

if __name__ == "__main__":
    saved_count = crawl_news_to_frontend()
    crawl_horoscope_to_frontend()
    crawl_weather_to_frontend()
    print(f"完成：新增 {saved_count} 則新聞到 {DB_PATH}")
    print("接著啟動 backend/main.py 的 FastAPI，前端會透過 /api/news 讀取這些資料。")
